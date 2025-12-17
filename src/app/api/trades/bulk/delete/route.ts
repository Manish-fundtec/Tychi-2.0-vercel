import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/mongodb";
import Trades from "@/modals/trades";

/**
 * Helper function to check if selected trades are continuous from latest
 * @param sortedAll - All trades for a symbol, sorted by date DESC
 * @param sortedSelected - Selected trades to delete, sorted by date DESC
 * @returns {ok: boolean, reason?: string}
 */
function areTradesContinuous(sortedAll: any[], sortedSelected: any[]): { ok: boolean; reason?: string } {
  if (sortedSelected.length === 0) {
    return { ok: false, reason: "No trades selected" };
  }

  // Rule 1: Latest must match
  if (sortedAll[0].trade_id !== sortedSelected[0].trade_id) {
    return {
      ok: false,
      reason: "Latest trade is not selected. Bulk delete must start from the most recent trade.",
    };
  }

  // Rule 2: Check continuity — no gaps
  for (let i = 0; i < sortedSelected.length; i++) {
    if (sortedSelected[i].trade_id !== sortedAll[i].trade_id) {
      return {
        ok: false,
        reason: `Missing trade between ${sortedSelected[i - 1]?.trade_id || "start"} and ${sortedSelected[i].trade_id}. Selection must be continuous.`,
      };
    }
  }

  return { ok: true };
}

/**
 * POST /api/trades/bulk/delete
 * Bulk delete trades with validation:
 * - Latest trade must be selected
 * - Selected trades must be continuous from latest to older
 * - No gaps allowed
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { tradeIds } = body;

    console.log('[BulkDelete] Request received:', { tradeIds, count: tradeIds?.length });

    // Validation: Ensure tradeIds is provided
    if (!tradeIds || !Array.isArray(tradeIds) || tradeIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No trade IDs provided",
        },
        { status: 400 }
      );
    }

    // Connect to database
    await db.connect();

    // Fetch all selected trades
    const selectedTrades = await Trades.find({
      trade_id: { $in: tradeIds },
    }).lean();

    console.log('[BulkDelete] Found selected trades:', selectedTrades.length);

    if (selectedTrades.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No trades found with the provided IDs",
        },
        { status: 404 }
      );
    }

    // Group trades by fund_id + symbol_id
    const tradesByFundSymbol: Record<string, any[]> = {};

    for (const trade of selectedTrades) {
      const groupKey = `${trade.fund_id}::${trade.symbol_id}`;
      if (!tradesByFundSymbol[groupKey]) {
        tradesByFundSymbol[groupKey] = [];
      }
      tradesByFundSymbol[groupKey].push(trade);
    }

    console.log('[BulkDelete] Grouped by fund+symbol:', Object.keys(tradesByFundSymbol).length);

    // 🔥 NEW LOGIC: Validate continuous delete from latest
    const symbolValidationErrors = [];

    for (const [groupKey, groupTrades] of Object.entries(tradesByFundSymbol)) {
      const [fundId, symbolId] = groupKey.split("::");

      console.log(`[BulkDelete] Validating ${groupKey}:`, { 
        fundId, 
        symbolId, 
        selectedCount: groupTrades.length 
      });

      // Get ALL trades sorted correctly for this symbol
      const allSymbolTrades = await Trades.find({
        fund_id: fundId,
        symbol_id: symbolId,
      })
        .sort({
          trade_date: -1,    // DESC
          created_at: -1,    // DESC
          trade_id: -1,      // DESC
        })
        .lean();

      console.log(`[BulkDelete] Total trades for ${groupKey}:`, allSymbolTrades.length);

      // Sort selected group using same rule
      const selectedSorted = groupTrades.sort((a, b) => {
        const dA = new Date(a.trade_date).getTime() || 0;
        const dB = new Date(b.trade_date).getTime() || 0;
        if (dA !== dB) return dB - dA;

        const cA = new Date(a.created_at).getTime() || 0;
        const cB = new Date(b.created_at).getTime() || 0;
        if (cA !== cB) return cB - cA;

        return String(b.trade_id).localeCompare(String(a.trade_id));
      });

      // Validate continuity
      const check = areTradesContinuous(allSymbolTrades, selectedSorted);

      if (!check.ok) {
        console.log(`[BulkDelete] Validation failed for ${groupKey}:`, check.reason);
        
        symbolValidationErrors.push({
          symbol_id: symbolId,
          fund_id: fundId,
          message: check.reason,
          total_trades: allSymbolTrades.length,
          selected: selectedSorted.length,
          hint: "Bulk delete must be continuous from latest trade.",
        });
      } else {
        console.log(`[BulkDelete] Validation passed for ${groupKey}`);
      }
    }

    // If validation errors exist, return error response
    if (symbolValidationErrors.length > 0) {
      console.log('[BulkDelete] Validation failed:', symbolValidationErrors);
      
      return NextResponse.json(
        {
          success: false,
          message: "Cannot bulk delete. Some symbols have non-contiguous or incomplete selection.",
          issues: symbolValidationErrors,
        },
        { status: 400 }
      );
    }

    // ✅ Validation passed — proceed with deletion
    console.log('[BulkDelete] All validations passed, proceeding with deletion');

    const deleteResult = await Trades.deleteMany({
      trade_id: { $in: tradeIds },
    });

    console.log('[BulkDelete] Deletion completed:', {
      deletedCount: deleteResult.deletedCount,
      requested: tradeIds.length
    });

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deleteResult.deletedCount} trade(s)`,
      data: {
        deleted_count: deleteResult.deletedCount,
        requested_count: tradeIds.length,
      },
    });

  } catch (error: any) {
    console.error("[BulkDelete] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error deleting trades",
        error: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    await db.disconnect();
  }
}

