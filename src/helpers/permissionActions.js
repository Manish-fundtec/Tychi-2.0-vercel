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

  return permissions.some((p) => {
    const pFundId = p?.fund_id ?? p?.fundId;
    if (fundId != null && pFundId != null && String(pFundId) !== String(fundId)) return false;

    const pModuleKey = normalize(p?.module_key ?? p?.moduleKey ?? p?.module);
    if (!normalizedKeys.has(pModuleKey)) return false;

    return truthy(p?.[actionKey]);
  });
}

