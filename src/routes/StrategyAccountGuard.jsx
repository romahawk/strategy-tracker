// src/routes/StrategyAccountGuard.jsx
import { useEffect } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { strategyStore } from "../storage/strategyStore";
import { accountStore } from "../storage/accountStore";

export default function StrategyAccountGuard() {
  const navigate = useNavigate();
  const { strategyId: sidParam, accountId: aidParam } = useParams();

  useEffect(() => {
    const strategies = strategyStore.ensureDefaults();

    // Compute first valid target
    const firstStrategyId = Number(strategies?.[0]?.id) || 1;
    const firstAccountIdForFirstStrategy = accountStore.getFirstAccountId(firstStrategyId);

    // Validate current strategy
    const sid = Number(sidParam);
    const strategyExists = Number.isFinite(sid) && strategies.some((s) => Number(s.id) === sid);

    if (!strategyExists) {
      navigate(`/strategy/${firstStrategyId}/account/${firstAccountIdForFirstStrategy}`, {
        replace: true,
      });
      return;
    }

    // Validate current account for this strategy
    const aid = Number(aidParam);
    const accountExists = Number.isFinite(aid) && accountStore.exists(sid, aid);

    if (!accountExists) {
      const firstAid = accountStore.getFirstAccountId(sid);
      navigate(`/strategy/${sid}/account/${firstAid}`, { replace: true });
      return;
    }
  }, [sidParam, aidParam, navigate]);

  // If URL is valid, render the actual page under this guard
  return <Outlet />;
}
