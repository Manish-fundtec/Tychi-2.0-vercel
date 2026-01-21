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
    console.log(`🔍 canModuleAction: No permissions array or empty`, { moduleKeys, actionKey, fundId });
    return false;
  }

  const keys = Array.isArray(moduleKeys) ? moduleKeys : [moduleKeys];
  const normalizedKeys = new Set(keys.map(normalize).filter(Boolean));
  if (normalizedKeys.size === 0) {
    console.log(`🔍 canModuleAction: No valid module keys`, { moduleKeys, actionKey, fundId });
    return false;
  }

  // Debug: Log all permissions being checked
  if (actionKey === 'can_add' || actionKey === 'can_delete') {
    console.log(`🔍 canModuleAction START:`, {
      moduleKeys,
      normalizedKeys: Array.from(normalizedKeys),
      actionKey,
      fundId,
      permissionsCount: permissions.length,
    });
  }

  const result = permissions.some((p) => {
    const pFundId = p?.fund_id ?? p?.fundId;
    const pModuleKey = normalize(p?.module_key ?? p?.moduleKey ?? p?.module);
    const actionValue = p?.[actionKey];
    
    // Check each condition separately for debugging
    const fundIdMatches = fundId == null || pFundId == null || String(pFundId) === String(fundId);
    const moduleKeyMatches = normalizedKeys.has(pModuleKey);
    const isTruthy = truthy(actionValue);
    
    // Debug logging for troubleshooting - log ALL permissions, not just matching ones
    if (actionKey === 'can_add' || actionKey === 'can_delete') {
      console.log(`🔍 canModuleAction checking permission:`, {
        module_key: p?.module_key,
        normalizedModuleKey: pModuleKey,
        fund_id: pFundId,
        [actionKey]: actionValue,
        fundIdMatches,
        moduleKeyMatches,
        isTruthy,
        willMatch: fundIdMatches && moduleKeyMatches && isTruthy,
      });
    }
    
    // Fund ID check - if fundId is provided, it must match (unless permission has no fund_id)
    if (fundId != null && pFundId != null && String(pFundId) !== String(fundId)) {
      return false;
    }

    if (!moduleKeyMatches) {
      return false;
    }

    return isTruthy;
  });

  if (actionKey === 'can_add' || actionKey === 'can_delete') {
    console.log(`🔍 canModuleAction RESULT:`, {
      moduleKeys,
      actionKey,
      fundId,
      result,
    });
  }

  return result;
}

