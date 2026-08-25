import { FeatureKey, PRO_FEATURES_REGISTRY } from './billing-config';
import { entitlementService } from './entitlement-service';

/**
 * Feature Gates Provider
 * Evaluates feature entitlements against the verified server-side entitlement state.
 */
export class FeatureGates {
  /**
   * Returns true if the user has access to the specified feature.
   */
  public static hasAccess(featureKey: FeatureKey): boolean {
    const entitlement = entitlementService.getEntitlement();
    if (!entitlement) return false;

    // Active PRO or TRIAL has access to all Pro features
    if (entitlement.status === 'PRO' || entitlement.status === 'TRIAL') {
      return true;
    }

    // Check individual explicit feature flags if defined on entitlement
    if (entitlement.features && Array.isArray(entitlement.features)) {
      const featureId = PRO_FEATURES_REGISTRY[featureKey]?.id;
      return entitlement.features.includes(featureId);
    }

    return false;
  }

  /**
   * Returns metadata for a feature gate
   */
  public static getFeatureInfo(featureKey: FeatureKey) {
    return PRO_FEATURES_REGISTRY[featureKey];
  }

  /**
   * Returns whether the user is on an active Pro tier
   */
  public static isProUser(): boolean {
    const entitlement = entitlementService.getEntitlement();
    return entitlement?.status === 'PRO' || entitlement?.status === 'TRIAL';
  }
}
