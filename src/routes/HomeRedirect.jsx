// src/routes/HomeRedirect.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { strategyStore } from "../storage/strategyStore";
import { accountStore } from "../storage/accountStore";

export default function HomeRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const strategies = strategyStore.ensureDefaults();
    const firstStrategyId = Number(strategies?.[0]?.id) || 1;

    const firstAccountId = accountStore.getFirstAccountId(firstStrategyId);

    navigate(`/strategy/${firstStrategyId}/account/${firstAccountId}`, { replace: true });
  }, [navigate]);

  return null;
}
