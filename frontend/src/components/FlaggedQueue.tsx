import { gql, useMutation, useQuery, useSubscription } from "@apollo/client";

const FLAGGED_QUERY = gql`
  query FlaggedTransactions {
    flaggedTransactions {
      id
      payeeName
      amountCents
      createdAt
      riskScore
      flag {
        id
        reasonCodes
        narrative
        status
      }
    }
  }
`;

const RESOLVE_MUTATION = gql`
  mutation ResolveFlag($transactionId: String!, $decision: String!, $analyst: String!) {
    resolveFlag(transactionId: $transactionId, decision: $decision, analyst: $analyst) {
      id
      flag {
        status
      }
    }
  }
`;

const ON_FLAGGED = gql`
  subscription OnFlagged {
    onFlaggedTransaction {
      id
    }
  }
`;

function formatAmount(cents: number) {
  return (cents / 100).toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export default function FlaggedQueue() {
  const { data, loading, error, refetch } = useQuery(FLAGGED_QUERY, { pollInterval: 5000 });
  const [resolveFlag] = useMutation(RESOLVE_MUTATION);

  useSubscription(ON_FLAGGED, {
    onData: () => refetch(),
  });

  async function decide(transactionId: string, decision: string) {
    await resolveFlag({ variables: { transactionId, decision, analyst: "workshop-analyst" } });
    refetch();
  }

  const rows = data?.flaggedTransactions ?? [];

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>Flagged Transactions</h2>
          <span className="panel-sub">{rows.length} pending review</span>
        </div>
      </div>

      {loading && !data && <p className="muted">Loading flagged transactions&hellip;</p>}
      {error && <p className="muted">Could not reach the API: {error.message}</p>}

      {(!loading || data) && !error && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Payee</th>
                <th>Amount</th>
                <th>Risk</th>
                <th>Why flagged</th>
                <th>Decision</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="muted">
                    No pending flags. Submit a transaction to see one land here.
                  </td>
                </tr>
              )}
              {rows.map((t: any) => (
                <tr key={t.id}>
                  <td className="cell-title">{t.payeeName}</td>
                  <td>{formatAmount(t.amountCents)}</td>
                  <td>{Math.round(t.riskScore * 100)}%</td>
                  <td className="muted narrative-cell">{t.flag?.narrative}</td>
                  <td>
                    <div className="action-row">
                      <button onClick={() => decide(t.id, "APPROVE")}>Approve</button>
                      <button onClick={() => decide(t.id, "ESCALATE")}>Escalate</button>
                      <button className="danger" onClick={() => decide(t.id, "BLOCK")}>
                        Block
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
