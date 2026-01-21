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
  if (!Array.isArray(permissions) || permissions.length === 0) return false;

  const keys = Array.isArray(moduleKeys) ? moduleKeys : [moduleKeys];
  const normalizedKeys = new Set(keys.map(normalize).filter(Boolean));
  if (normalizedKeys.size === 0) return false;

  const result = permissions.some((p) => {
    const pFundId = p?.fund_id ?? p?.fundId;
    
    // Fund ID check - if fundId is provided, it must match (unless permission has no fund_id)
    if (fundId != null && pFundId != null && String(pFundId) !== String(fundId)) {
      return false;
    }

    const pModuleKey = normalize(p?.module_key ?? p?.moduleKey ?? p?.module);
    if (!normalizedKeys.has(pModuleKey)) {
      return false;
    }

    const actionValue = p?.[actionKey];
    const isTruthy = truthy(actionValue);
    
    // Debug logging for troubleshooting
    if (actionKey === 'can_add' || actionKey === 'can_delete') {
      console.log(`🔍 canModuleAction check:`, {
        moduleKeys,
        actionKey,
        fundId,
        permission: {
          module_key: p?.module_key,
          normalizedModuleKey: pModuleKey,
          fund_id: pFundId,
          [actionKey]: actionValue,
          isTruthy,
        },
        normalizedKeys: Array.from(normalizedKeys),
        moduleKeyMatches: normalizedKeys.has(pModuleKey),
        fundIdMatches: fundId == null || pFundId == null || String(pFundId) === String(fundId),
        finalResult: isTruthy,
      });
    }

    return isTruthy;
  });

  return result;
}

