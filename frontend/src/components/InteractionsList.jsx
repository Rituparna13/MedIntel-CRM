import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchInteractions,
  deleteInteraction,
  editInteraction,
  clearMessages,
} from "../store/interactionsSlice";

const SENTIMENT_CLASS = {
  Positive: "badge-positive",
  Neutral: "badge-neutral",
  Negative: "badge-negative",
};

export default function InteractionsList() {
  const dispatch = useDispatch();
  const { list, loading, success, error } = useSelector((s) => s.interactions);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    dispatch(fetchInteractions());
  }, [dispatch]);

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(fetchInteractions(search));
  };

  const handleDelete = (id) => {
    if (window.confirm(`Delete interaction ID ${id}?`)) {
      dispatch(deleteInteraction(id));
    }
  };

  const startEdit = (interaction) => {
    setEditingId(interaction.id);
    setEditForm({
      doctor_name: interaction.doctor_name || "",
      specialty: interaction.specialty || "",
      notes: interaction.notes || "",
      summary: interaction.summary || "",
      follow_up_action: interaction.follow_up_action || "",
      sentiment: interaction.sentiment || "Neutral",
      product_discussed: interaction.product_discussed || "",
    });
  };

  const handleEditSave = () => {
    dispatch(clearMessages());
    dispatch(editInteraction({ id: editingId, data: editForm }));
    setEditingId(null);
  };

  const formatDate = (d) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div>
      {/* Search bar */}
      <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          className="form-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by doctor name..."
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn btn-primary btn-sm">Search</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setSearch(""); dispatch(fetchInteractions("")); }}>
          Clear
        </button>
      </form>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">❌ {error}</div>}

      {loading && <div style={{ textAlign: "center", padding: 20 }}><span className="spinner" /></div>}

      {!loading && list.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <p>No interactions logged yet. Use the Form or Chat to add one!</p>
        </div>
      )}

      {list.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table className="interactions-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Doctor</th>
                <th>Date</th>
                <th>Type</th>
                <th>Product</th>
                <th>Sentiment</th>
                <th>Summary / Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item) => (
                <React.Fragment key={item.id}>
                  <tr>
                    <td><span className="badge badge-blue">#{item.id}</span></td>
                    <td>
                      <strong>{item.doctor_name}</strong>
                      {item.specialty && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{item.specialty}</div>}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>{formatDate(item.interaction_date)}</td>
                    <td>{item.interaction_type}</td>
                    <td>{item.product_discussed || "-"}</td>
                    <td>
                      <span className={`badge ${SENTIMENT_CLASS[item.sentiment] || "badge-neutral"}`}>
                        {item.sentiment || "Neutral"}
                      </span>
                    </td>
                    <td style={{ maxWidth: 280 }}>
                      <div style={{ fontSize: 13, color: "var(--text)" }}>
                        {item.summary || (item.notes ? item.notes.slice(0, 100) + (item.notes.length > 100 ? "…" : "") : "-")}
                      </div>
                      {item.follow_up_action && (
                        <div style={{ fontSize: 11, color: "var(--primary)", marginTop: 2 }}>
                          📌 {item.follow_up_action}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => startEdit(item)}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>

                  {/* Inline Edit Row */}
                  {editingId === item.id && (
                    <tr>
                      <td colSpan={8}>
                        <div className="inline-edit-form">
                          <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 10, color: "var(--primary)" }}>
                            ✏️ Editing Interaction #{item.id}
                          </div>
                          <div className="form-grid">
                            <div className="form-group">
                              <label className="form-label">Doctor Name</label>
                              <input className="form-input" value={editForm.doctor_name}
                                onChange={(e) => setEditForm((f) => ({ ...f, doctor_name: e.target.value }))} />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Specialty</label>
                              <input className="form-input" value={editForm.specialty}
                                onChange={(e) => setEditForm((f) => ({ ...f, specialty: e.target.value }))} />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Product</label>
                              <input className="form-input" value={editForm.product_discussed}
                                onChange={(e) => setEditForm((f) => ({ ...f, product_discussed: e.target.value }))} />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Sentiment</label>
                              <select className="form-select" value={editForm.sentiment}
                                onChange={(e) => setEditForm((f) => ({ ...f, sentiment: e.target.value }))}>
                                <option>Positive</option>
                                <option>Neutral</option>
                                <option>Negative</option>
                              </select>
                            </div>
                            <div className="form-group full-width">
                              <label className="form-label">Notes</label>
                              <textarea className="form-textarea" rows={2} value={editForm.notes}
                                onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} />
                            </div>
                            <div className="form-group full-width">
                              <label className="form-label">Follow-up Action</label>
                              <input className="form-input" value={editForm.follow_up_action}
                                onChange={(e) => setEditForm((f) => ({ ...f, follow_up_action: e.target.value }))} />
                            </div>
                          </div>
                          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                            <button className="btn btn-primary btn-sm" onClick={handleEditSave}>💾 Save</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
