import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logInteractionForm, clearMessages } from "../store/interactionsSlice";

const INITIAL_FORM = {
  doctor_name: "",
  specialty: "",
  interaction_date: new Date().toISOString().split("T")[0],
  interaction_type: "In-Person",
  notes: "",
  topics_discussed: "",
  sentiment: "Neutral",
  product_discussed: "",
  follow_up_action: "",
};

const SPECIALTIES = [
  "Oncology", "Cardiology", "Neurology", "Endocrinology",
  "Gastroenterology", "Pulmonology", "General Practice", "Psychiatry", "Other"
];

const INTERACTION_TYPES = ["In-Person", "Phone Call", "Email", "Virtual Meeting", "Conference"];
const SENTIMENTS = ["Positive", "Neutral", "Negative"];

export default function LogInteractionForm() {
  const dispatch = useDispatch();
  const { loading, success, error } = useSelector((s) => s.interactions);
  const [form, setForm] = useState(INITIAL_FORM);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearMessages());
    const result = await dispatch(logInteractionForm(form));
    if (!result.error) {
      setForm({ ...INITIAL_FORM, interaction_date: new Date().toISOString().split("T")[0] });
    }
  };

  return (
    <div>
      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">❌ {error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Doctor Name *</label>
            <input
              className="form-input"
              name="doctor_name"
              value={form.doctor_name}
              onChange={handleChange}
              placeholder="Dr. Arjun Sharma"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Specialty</label>
            <select className="form-select" name="specialty" value={form.specialty} onChange={handleChange}>
              <option value="">Select specialty</option>
              {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Date *</label>
            <input
              className="form-input"
              type="date"
              name="interaction_date"
              value={form.interaction_date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Interaction Type</label>
            <select className="form-select" name="interaction_type" value={form.interaction_type} onChange={handleChange}>
              {INTERACTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Product Discussed</label>
            <input
              className="form-input"
              name="product_discussed"
              value={form.product_discussed}
              onChange={handleChange}
              placeholder="e.g. Oncovax 200mg"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Sentiment</label>
            <select className="form-select" name="sentiment" value={form.sentiment} onChange={handleChange}>
              {SENTIMENTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="form-group full-width">
            <label className="form-label">Topics Discussed</label>
            <input
              className="form-input"
              name="topics_discussed"
              value={form.topics_discussed}
              onChange={handleChange}
              placeholder="e.g. Drug efficacy, Side effects, Dosage"
            />
          </div>

          <div className="form-group full-width">
            <label className="form-label">Interaction Notes</label>
            <textarea
              className="form-textarea"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Describe what was discussed, outcomes, doctor's feedback..."
              rows={4}
            />
          </div>

          <div className="form-group full-width">
            <label className="form-label">Follow-up Action</label>
            <input
              className="form-input"
              name="follow_up_action"
              value={form.follow_up_action}
              onChange={handleChange}
              placeholder="e.g. Send clinical trial data by Friday"
            />
          </div>
        </div>

        <div style={{ marginTop: "20px" }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <><span className="spinner" style={{width:14,height:14}} /> Saving...</> : "💾 Log Interaction"}
          </button>
        </div>
      </form>
    </div>
  );
}
