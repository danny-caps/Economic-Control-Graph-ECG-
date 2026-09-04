"""
Exposure & Contagion Risk Engine
Translates hidden graph correlation into tangible financial capital exposure and systemic contagion risk.
"""

from typing import Dict, List, Any
import numpy as np

def format_inr(amount_in_rupees: float) -> str:
    """Formats amount in Indian Rupees (INR Lakhs / Crores)"""
    if amount_in_rupees >= 10000000: # >= 1 Crore
        return f"₹{amount_in_rupees / 10000000:.2f} Cr"
    elif amount_in_rupees >= 100000: # >= 1 Lakh
        return f"₹{amount_in_rupees / 100000:.2f} L"
    else:
        return f"₹{amount_in_rupees:,.2f}"

class ExposureContagionEngine:
    def __init__(self):
        self.default_recoverability_factor = 0.95 # Higher factor for non-reversible P2P/Crypto flows

    def calculate_cluster_exposure(self, cluster: Dict[str, Any], pcc_score: float) -> Dict[str, Any]:
        """
        Calculates:
        - Gross Exposure
        - Network-Adjusted Exposure (NAE)
        - Potential Contagion Loss across connected merchant settlements
        - Early-Warning Exposure metrics
        """
        gross_exposure = float(cluster.get("gross_exposure", 0.0))
        if gross_exposure <= 0:
            # Fallback based on accounts count
            gross_exposure = len(cluster.get("accounts", [])) * 45000.0 * 6.0

        # NAE = Gross * Pcc * Recoverability adjustment
        # Higher Pcc and lower recoverability yields higher network-adjusted exposure
        recoverability_penalty = 1.05 if cluster.get("multi_hop_depth", 1) >= 3 else 0.98
        nae = gross_exposure * pcc_score * recoverability_penalty
        nae = min(gross_exposure * 1.15, max(0.0, nae))

        # Contagion Risk Simulation:
        # If this cluster defaults/busts out, what downstream merchant settlement accounts & banking routes are contaminated?
        accounts_count = len(cluster.get("accounts", []))
        contagion_multiplier = 1.45 if cluster.get("multi_hop_depth", 1) >= 3 else 1.20
        potential_contagion = gross_exposure * (contagion_multiplier - 1.0) * (pcc_score ** 1.5)
        
        contagion_level = "Critical" if potential_contagion > 2500000 else "High" if potential_contagion > 1000000 else "Medium" if potential_contagion > 300000 else "Low"

        # Early-warning detection exposure comparison (PRD Section 30)
        # ECG detects at ~20% of the campaign cycle; Account ML detects at ~90%
        ecg_detection_exposure = gross_exposure * 0.18
        baseline_detection_exposure = gross_exposure * 0.88
        exposure_saved_early = max(0.0, baseline_detection_exposure - ecg_detection_exposure)

        return {
            "cluster_id": cluster["cluster_id"],
            "gross_exposure": round(gross_exposure, 2),
            "gross_exposure_formatted": format_inr(gross_exposure),
            "network_adjusted_exposure": round(nae, 2),
            "network_adjusted_exposure_formatted": format_inr(nae),
            "potential_contagion": round(potential_contagion, 2),
            "potential_contagion_formatted": format_inr(potential_contagion),
            "contagion_level": contagion_level,
            "contagion_pathway": "Accounts -> Intermediary Mules -> Gateway Settlement Pool -> Merchant Payout Network",
            "early_warning": {
                "ecg_exposure_at_detection": round(ecg_detection_exposure, 2),
                "ecg_exposure_at_detection_formatted": format_inr(ecg_detection_exposure),
                "baseline_exposure_at_detection": round(baseline_detection_exposure, 2),
                "baseline_exposure_at_detection_formatted": format_inr(baseline_detection_exposure),
                "exposure_prevented": round(exposure_saved_early, 2),
                "exposure_prevented_formatted": format_inr(exposure_saved_early),
                "early_warning_gain_percentage": "79.5% Earlier Capital Protection"
            }
        }
