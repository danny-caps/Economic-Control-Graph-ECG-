"""
Decision Engine & Counterfactual Simulator
Implements:
1. Proportional Graduated Intervention (Observe -> Protect/Throttle -> Contain/Hold -> Prevent Concentration)
2. Showcase Counterfactual Simulator (Do Nothing vs Throttle vs Block)
"""

from typing import Dict, List, Any
from .exposure_engine import format_inr

class DecisionEngine:
    def __init__(self):
        pass

    def recommend_intervention(self, pcc: float, gross_exposure: float, evidence_quality: str) -> Dict[str, Any]:
        """
        Determines graduated defensive intervention based on:
        Risk score (Pcc) x Aggregate exposure x Evidence strength
        """
        if pcc < 0.35:
            action = "Observe"
            tier = "Low Risk / High Legitimate Correlation"
            strategy = "Passive monitoring. Gather topological evidence with zero customer friction."
            actions_list = [
                "Continue passive transaction monitoring",
                "Log time-series edge evolution in background",
                "No transaction throttling or friction applied"
            ]
            reversibility = "100% Reversible (Zero Impact)"
        elif pcc < 0.70:
            action = "Protect / Throttle"
            tier = "Medium Risk / Moderate Correlation"
            strategy = "Dynamic velocity throttling and stepped-up verification on common endpoints."
            actions_list = [
                "Cap single transaction velocity to ₹10,000",
                "Trigger step-up biometric/MFA on new beneficiary additions",
                "Hold instant payout queue for +2 hours",
                "Alert tier-1 risk analyst team"
            ]
            reversibility = "High (Temporary dynamic throttle)"
        elif pcc < 0.88 or gross_exposure < 1000000:
            action = "Contain / Hold"
            tier = "High Confidence Coordinated Syndicate"
            strategy = "Isolate cash-out pathways and hold settlement payouts pending review."
            actions_list = [
                "Hold settlement batch to identified beneficiary vault",
                "Require re-KYC / video verification on originating accounts",
                "Escalate directly to Senior Fraud Risk Lead",
                "Restrict cross-account transfer routing"
            ]
            reversibility = "Moderate (Settlement hold is fully reversible post-audit)"
        else:
            action = "Prevent Concentration / Circuit Breaker"
            tier = "Critical Systemic Bust-Out Threat"
            strategy = "Apply targeted systemic pathway block on cash-out nodes and alert risk leadership."
            actions_list = [
                "Immediate circuit breaker on high-risk cashout beneficiaries",
                "Isolate common hardware/IP subnets from instant settlement APIs",
                "Initiate formal CRO emergency risk operations review",
                "Preserve cryptographic audit log for financial law enforcement"
            ]
            reversibility = "Targeted Bounded Action (Non-collateral)"

        return {
            "recommended_action": action,
            "tier": tier,
            "strategy_summary": strategy,
            "proportional_action_items": actions_list,
            "reversibility": reversibility
        }

    def simulate_counterfactuals(self, pcc: float, gross_exposure: float, friction_weight: float = 1.0) -> Dict[str, Any]:
        """
        Showcase Counterfactual Simulator (PRD Section 24):
        Optimizes risk management as a capital & friction trade-off rather than naive binary classification.
        """
        # 1. Do Nothing
        exp_loss_do_nothing = gross_exposure * pcc
        friction_do_nothing = 0.0
        net_impact_do_nothing = -exp_loss_do_nothing

        # 2. Throttle / Graduated Protection (Optimal balance)
        # Throttles reduce exposure by ~60%, catch ~85% of fraud, with very low false positive friction
        exposure_throttle = gross_exposure * 0.40
        exp_loss_throttle = exposure_throttle * pcc * 0.35
        friction_throttle = (gross_exposure * (1.0 - pcc) * 0.02 + 15000.0) * friction_weight
        net_saved_throttle = exp_loss_do_nothing - exp_loss_throttle - friction_throttle

        # 3. Hard Block (Traditional blunt tool)
        # Blocks 98% of fraud, but inflicts massive false positive costs on legitimate accounts
        exposure_block = gross_exposure * 0.12
        exp_loss_block = exposure_block * pcc * 0.10
        friction_block = (gross_exposure * (1.0 - pcc) * 0.25 + 180000.0) * friction_weight
        net_saved_block = exp_loss_do_nothing - exp_loss_block - friction_block

        # Determine winner
        best_scenario = "Throttle (Recommended)" if net_saved_throttle >= net_saved_block else "Block"
        if pcc < 0.30: best_scenario = "Do Nothing (Observe)"

        return {
            "pcc": pcc,
            "gross_exposure": gross_exposure,
            "gross_exposure_formatted": format_inr(gross_exposure),
            "recommended_policy": best_scenario,
            "scenarios": {
                "do_nothing": {
                    "scenario_name": "Do Nothing (Passive)",
                    "potential_exposure": gross_exposure,
                    "potential_exposure_formatted": format_inr(gross_exposure),
                    "expected_loss": round(exp_loss_do_nothing, 2),
                    "expected_loss_formatted": format_inr(exp_loss_do_nothing),
                    "customer_friction": "Zero (0)",
                    "friction_cost": 0.0,
                    "friction_cost_formatted": format_inr(0.0),
                    "net_economic_value": round(net_impact_do_nothing, 2),
                    "net_economic_value_formatted": f"-{format_inr(exp_loss_do_nothing)}"
                },
                "throttle": {
                    "scenario_name": "Throttle & Verify (Recommended)",
                    "potential_exposure": round(exposure_throttle, 2),
                    "potential_exposure_formatted": format_inr(exposure_throttle),
                    "expected_loss": round(exp_loss_throttle, 2),
                    "expected_loss_formatted": format_inr(exp_loss_throttle),
                    "customer_friction": "Low (Targeted Step-Up Auth)",
                    "friction_cost": round(friction_throttle, 2),
                    "friction_cost_formatted": format_inr(friction_throttle),
                    "capital_preserved": round(exp_loss_do_nothing - exp_loss_throttle, 2),
                    "capital_preserved_formatted": format_inr(exp_loss_do_nothing - exp_loss_throttle),
                    "net_economic_gain": round(net_saved_throttle, 2),
                    "net_economic_gain_formatted": format_inr(net_saved_throttle)
                },
                "block": {
                    "scenario_name": "Hard Binary Block",
                    "potential_exposure": round(exposure_block, 2),
                    "potential_exposure_formatted": format_inr(exposure_block),
                    "expected_loss": round(exp_loss_block, 2),
                    "expected_loss_formatted": format_inr(exp_loss_block),
                    "customer_friction": "High (Customer Complaints & Churn Risk)",
                    "friction_cost": round(friction_block, 2),
                    "friction_cost_formatted": format_inr(friction_block),
                    "capital_preserved": round(exp_loss_do_nothing - exp_loss_block, 2),
                    "capital_preserved_formatted": format_inr(exp_loss_do_nothing - exp_loss_block),
                    "net_economic_gain": round(net_saved_block, 2),
                    "net_economic_gain_formatted": format_inr(net_saved_block)
                }
            }
        }
