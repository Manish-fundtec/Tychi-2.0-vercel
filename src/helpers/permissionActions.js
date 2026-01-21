/**
 * Permission helpers (UI gating)
 *
 * Permissions shape (from backend):
 * { module_key, fund_id, can_view, can_add, can_edit, can_delete }
 */

const truthy = (v) => v === true || v === 1 || v === '1' || v === 'true';

const normalize = (s) => (s ?? '').toString().trim().toLowerCase();

/**
 * Check if user can perform an action on a module.
 *
 * @param {Array} permissions
 * @param {string|string[]} moduleKeys - module_key(s) to match (case-insensitive)
 * @param {'can_view'|'can_add'|'can_edit'|'can_delete'} actionKey
 * @param {string|number|null} fundId - optional fund filter
 */
export function canModuleAction(permissions, moduleKeys, actionKey, fundId = null) {
  if (!Array.isArray(permissions) || permissions.length === 0) {
    console.log(`🚫 canModuleAction: No permissions`, { moduleKeys, actionKey, fundId });
    return false;
  }

  const keys = Array.isArray(moduleKeys) ? moduleKeys : [moduleKeys];
  const normalizedKeys = new Set(keys.map(normalize).filter(Boolean));
  if (normalizedKeys.size === 0) {
    console.log(`🚫 canModuleAction: No valid module keys`, { moduleKeys });
    return false;
  }

  console.log(`🔍 canModuleAction: Checking`, {
    moduleKeys: Array.from(normalizedKeys),
    actionKey,
    fundId,
    totalPermissions: permissions.length
  });

  const result = permissions.some((p) => {
    const pFundId = p?.fund_id ?? p?.fundId;
    const pModuleKey = normalize(p?.module_key ?? p?.moduleKey ?? p?.module);
    const actionValue = p?.[actionKey];
    
    // If fundId is provided, check if permission matches:
    // - If permission has fund_id, it must match
    // - If permission has no fund_id (null/undefined), it's considered global and matches
    if (fundId != null && pFundId != null && String(pFundId) !== String(fundId)) {
      console.log(`  ⏭️  Skipped (fund mismatch):`, {
        module: pModuleKey,
        permissionFundId: pFundId,
        requestedFundId: fundId,
        actionValue
      });
      return false;
    }

    if (!normalizedKeys.has(pModuleKey)) {
      console.log(`  ⏭️  Skipped (module mismatch):`, {
        permissionModule: pModuleKey,
        requestedModules: Array.from(normalizedKeys),
        fundId: pFundId
      });
      return false;
    }

    const isAllowed = truthy(actionValue);
    console.log(`  ${isAllowed ? '✅' : '❌'} Match found:`, {
      module: pModuleKey,
      fundId: pFundId,
      actionKey,
      actionValue,
      isAllowed,
      rawValue: actionValue,
      type: typeof actionValue
    });

    return isAllowed;
  });

  console.log(`🎯 canModuleAction Result: ${result}`, { moduleKeys: Array.from(normalizedKeys), actionKey, fundId });
  return result;
}

