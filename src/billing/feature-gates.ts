import { FeatureKey, PRO_FEATURES_REGISTRY } from './billing-config';

/**
 * Feature access policy for the free studio edition.
 * All mastering capabilities are available to every user.
 */
export class FeatureGates {
  public static hasAccess(_featureKey: FeatureKey): boolean {
    return true;
  }

  public static getFeatureInfo(featureKey: FeatureKey) {
    return PRO_FEATURES_REGISTRY[featureKey];
  }

  public static isProUser(): boolean {
    return false;
  }
}
