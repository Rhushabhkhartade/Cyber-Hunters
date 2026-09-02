from app.schemas.analysis import SocialEngineeringAnalysis


class RiskEngine:
    @staticmethod
    def calculate_overall_risk(deepfake_analysis: dict, social_analysis: SocialEngineeringAnalysis, audio_analysis: dict) -> dict:
        audio_quality_penalty = 0
        if audio_analysis.get("sample_rate", 0) < 22050:
            audio_quality_penalty += 8
        if audio_analysis.get("bitrate_kbps") is not None and audio_analysis["bitrate_kbps"] < 128:
            audio_quality_penalty += 8

        deepfake_score = int(deepfake_analysis.get("risk_score", 0))
        social_score = int(social_analysis.risk_score)
        score = min(100, max(0, int(round(deepfake_score * 0.55 + social_score * 0.35 + audio_quality_penalty * 0.10))))

        if score >= 80:
            level = "CRITICAL"
        elif score >= 55:
            level = "HIGH"
        elif score >= 30:
            level = "MEDIUM"
        else:
            level = "LOW"

        risk_factors = []
        if deepfake_score >= 50:
            risk_factors.append("Audio authenticity indicators suggest increased risk in demo mode.")
        if social_score >= 25:
            risk_factors.append("Social engineering indicators were detected in the transcript.")
        if audio_quality_penalty:
            risk_factors.append("Audio quality or format may reduce analysis confidence.")
        if not risk_factors:
            risk_factors.append("No significant risk factors detected in the demo pipeline.")

        return {
            "score": score,
            "level": level,
            "risk_factors": risk_factors,
        }
