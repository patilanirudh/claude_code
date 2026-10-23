import { gql, useMutation, useQuery } from "@apollo/client";
import { FormEvent, useState } from "react";

const ACCOUNTS_QUERY = gql`
  query Accounts {
    accounts {
      id
      holderName
      accountNumber
    }
  }
`;

const SUBMIT_MUTATION = gql`
  mutation SubmitTransaction(
    $accountId: String!
    $payeeName: String!
    $payeeId: String!
    $amountCents: Int!
    $isNewPayee: Boolean!
  ) {
    submitTransaction(
      accountId: $accountId
      payeeName: $payeeName
      payeeId: $payeeId
      amountCents: $amountCents
      isNewPayee: $isNewPayee
    ) {
      id
      riskScore
      flag {
        status
      }
    }
  }
`;

export default function SubmitTransaction() {
  const { data } = useQuery(ACCOUNTS_QUERY);
  const [submitTransaction, { loading }] = useMutation(SUBMIT_MUTATION);
  const [form, setForm] = useState({ accountId: "", payeeName: "", amount: "", isNewPayee: true });
  const [result, setResult] = useState<string | null>(null);

  const accounts = data?.accounts ?? [];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const res = await submitTransaction({
      variables: {
        accountId: form.accountId,
        payeeName: form.payeeName,
        payeeId: `payee-${Date.now()}`,
        amountCents: Math.round(parseFloat(form.amount || "0") * 100),
        isNewPayee: form.isNewPayee,
      },
    });
    const txn = res.data.submitTransaction;
    setResult(
      txn.flag
        ? `Flagged (risk ${Math.round(txn.riskScore * 100)}%) -- check the Flagged Queue.`
        : `Posted clean (risk ${Math.round(txn.riskScore * 100)}%).`
    );
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>Submit Test Transaction</h2>
          <span className="panel-sub">Runs through the real risk-scoring pipeline</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="form-grid">
        <label>
          Account
          <select
            value={form.accountId}
            onChange={(e) => setForm({ ...form, accountId: e.target.value })}
            required
          >
            <option value="" disabled>
              Select account
            </option>
            {accounts.map((a: any) => (
              <option key={a.id} value={a.id}>
                {a.holderName} ({a.accountNumber})
              </option>
            ))}
          </select>
        </label>

        <label>
          Payee name
          <input
            value={form.payeeName}
            onChange={(e) => setForm({ ...form, payeeName: e.target.value })}
            required
          />
        </label>

        <label>
          Amount (USD)
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            required
          />
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={form.isNewPayee}
            onChange={(e) => setForm({ ...form, isNewPayee: e.target.checked })}
          />
          New payee
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Submitting…" : "Submit transaction"}
        </button>
      </form>

      {result && <p className="result-note">{result}</p>}
    </section>
  );
}
