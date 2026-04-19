import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axiosConfig";

// Async thunks
export const fetchInteractions = createAsyncThunk(
  "interactions/fetchAll",
  async (doctorName = "", { rejectWithValue }) => {
    try {
      const params = doctorName ? { doctor_name: doctorName } : {};
      const response = await api.get("/get-interactions", { params });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to fetch interactions");
    }
  }
);

export const logInteractionForm = createAsyncThunk(
  "interactions/logForm",
  async (interactionData, { rejectWithValue }) => {
    try {
      const response = await api.post("/log-interaction", interactionData);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to log interaction");
    }
  }
);

export const editInteraction = createAsyncThunk(
  "interactions/edit",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/edit-interaction/${id}`, data);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to edit interaction");
    }
  }
);

export const deleteInteraction = createAsyncThunk(
  "interactions/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/delete-interaction/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to delete interaction");
    }
  }
);

// Slice
const interactionsSlice = createSlice({
  name: "interactions",
  initialState: {
    list: [],
    loading: false,
    error: null,
    success: null,
    editingId: null,
  },
  reducers: {
    clearMessages(state) {
      state.error = null;
      state.success = null;
    },
    setEditingId(state, action) {
      state.editingId = action.payload;
    },
  },
  extraReducers: (builder) => {
    // fetchInteractions
    builder
      .addCase(fetchInteractions.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchInteractions.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchInteractions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // logInteractionForm
    builder
      .addCase(logInteractionForm.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(logInteractionForm.fulfilled, (state, action) => {
        state.loading = false;
        state.list.unshift(action.payload);
        state.success = `✅ Interaction logged for Dr. ${action.payload.doctor_name}`;
      })
      .addCase(logInteractionForm.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // editInteraction
    builder
      .addCase(editInteraction.pending, (state) => { state.loading = true; })
      .addCase(editInteraction.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.list.findIndex((i) => i.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
        state.success = `✅ Interaction updated`;
        state.editingId = null;
      })
      .addCase(editInteraction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // deleteInteraction
    builder
      .addCase(deleteInteraction.pending, (state) => { state.loading = true; })
      .addCase(deleteInteraction.fulfilled, (state, action) => {
        state.loading = false;
        state.list = state.list.filter((i) => i.id !== action.payload);
        state.success = `🗑️ Interaction deleted`;
      })
      .addCase(deleteInteraction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearMessages, setEditingId } = interactionsSlice.actions;
export default interactionsSlice.reducer;
