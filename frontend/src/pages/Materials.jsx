import React, { useState, useEffect } from "react";
import { materialService } from "../services/materialService";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import SearchBar from "../components/SearchBar";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import ConfirmModal from "../components/ConfirmModal";
import { formatCurrency, formatValue } from "../utils/currencyFormatter";

export default function Materials() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [currentMaterial, setCurrentMaterial] = useState(null);
  const [form, setForm] = useState({
    name: "",
    category: "Structural",
    quantity: "",
    unit: "Bags",
    unit_price: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { success: toastSuccess, error: toastError } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await materialService.getMaterials();
      if (res.materials) setMaterials(res.materials);
    } catch (err) {
      toastError("Load Error", "Unable to load site inventory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setModalMode("create");
    setForm({
      name: "",
      category: "Structural",
      quantity: "",
      unit: "Bags",
      unit_price: "",
    });
    setShowModal(true);
  };

  const openEditModal = (m) => {
    setModalMode("edit");
    setCurrentMaterial(m);
    setForm({
      name: m.name || "",
      category: m.category || "Structural",
      quantity: m.quantity || "",
      unit: m.unit || "Units",
      unit_price: m.unit_price || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || form.quantity === "" || form.unit_price === "") {
      toastError("Missing Fields", "Please enter material name, quantity and price.");
      return;
    }

    setSubmitting(true);
    try {
      if (modalMode === "create") {
        const res = await materialService.createMaterial(form);
        if (res.success) {
          toastSuccess("Success", "Material added to inventory.");
          setShowModal(false);
          loadData();
        }
      } else {
        const res = await materialService.updateMaterial(currentMaterial.id, form);
        if (res.success) {
          toastSuccess("Success", "Material record updated.");
          setShowModal(false);
          loadData();
        }
      }
    } catch (err) {
      toastError("Error", err.response?.data?.error || "Failed to save material.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await materialService.deleteMaterial(deleteId);
      if (res.success) {
        toastSuccess("Deleted", "Material removed from catalog.");
        setDeleteId(null);
        loadData();
      }
    } catch (err) {
      toastError("Error", err.response?.data?.error || "Failed to delete material.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Metrics
  const totalMaterials = materials.length;
  const totalQuantity = materials.reduce((sum, m) => sum + (Number(m.quantity) || 0), 0);
  const lowStock = materials.filter((m) => Number(m.quantity) > 0 && Number(m.quantity) < 20).length;
  const outOfStock = materials.filter((m) => Number(m.quantity) <= 0).length;

  const filteredMaterials = materials.filter((m) => {
    const matchesSearch =
      (m.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.category || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === "ALL" || m.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div>
      <PageHeader
        title="Site Materials &amp; Inventory"
        subtitle="Track stock levels, consumable construction materials, unit valuations, and shortage alerts."
        actions={
          <button type="button" className="btn-saas-primary" onClick={openCreateModal}>
            <i className="bi bi-plus-circle"></i> Add Material
          </button>
        }
      />

      {/* 4 Cards: Total Materials, Total Quantity, Low Stock, Out of Stock */}
      <div className="row g-3 mb-4">
        <div className="col-md-3 col-sm-6">
          <StatCard
            icon="bi-box-seam-fill"
            label="Total Materials"
            value={String(totalMaterials).padStart(2, "0")}
            footer="Catalogued Items"
            colorBg="#eff6ff"
            colorIcon="#3b82f6"
          />
        </div>
        <div className="col-md-3 col-sm-6">
          <StatCard
            icon="bi-boxes"
            label="Total Quantity"
            value={Math.round(totalQuantity).toLocaleString("en-IN")}
            footer="Units in Stock"
            colorBg="#ecfdf5"
            colorIcon="#10b981"
          />
        </div>
        <div className="col-md-3 col-sm-6">
          <StatCard
            icon="bi-exclamation-triangle-fill"
            label="Low Stock"
            value={String(lowStock).padStart(2, "0")}
            footer="< 20 Units Remaining"
            colorBg="#fef3c7"
            colorIcon="#f59e0b"
          />
        </div>
        <div className="col-md-3 col-sm-6">
          <StatCard
            icon="bi-x-circle-fill"
            label="Out of Stock"
            value={String(outOfStock).padStart(2, "0")}
            footer="Requires Urgent Order"
            colorBg="#fee2e2"
            colorIcon="#ef4444"
          />
        </div>
      </div>

      <div className="saas-card mb-4">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search materials by name or category..."
          filterValue={categoryFilter}
          onFilterChange={setCategoryFilter}
          filterOptions={[
            { value: "ALL", label: "All Categories" },
            { value: "Structural", label: "Structural" },
            { value: "Finishing", label: "Finishing" },
            { value: "Electrical", label: "Electrical" },
            { value: "Plumbing", label: "Plumbing" },
          ]}
        />

        {loading ? (
          <LoadingState message="Loading inventory stock..." />
        ) : filteredMaterials.length === 0 ? (
          <EmptyState
            icon="bi-box-seam"
            title="No materials found"
            message="No inventory records match your criteria."
            actionLabel="Add Material"
            onAction={openCreateModal}
          />
        ) : (
          <div className="app-table-container">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total Value</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMaterials.map((m) => {
                  const qty = Number(m.quantity) || 0;
                  const price = Number(m.unit_price) || 0;
                  const total = m.total_value ? Number(m.total_value) : qty * price;

                  let stockStatus = "In Stock";
                  let badgeClass = "badge-active";
                  if (qty <= 0) {
                    stockStatus = "Out of Stock";
                    badgeClass = "badge-absent";
                  } else if (qty < 20) {
                    stockStatus = "Low Stock";
                    badgeClass = "badge-pending";
                  }

                  return (
                    <tr key={m.id}>
                      <td>
                        <strong className="text-navy">{m.name}</strong>
                      </td>
                      <td>
                        <span className="badge bg-light text-navy border">{m.category}</span>
                      </td>
                      <td className="fw-bold">
                        {qty} <small className="text-muted fw-normal">{m.unit}</small>
                      </td>
                      <td>{formatCurrency(price)}</td>
                      <td className="fw-bold text-success">{formatCurrency(total)}</td>
                      <td>
                        <span className={`app-badge ${badgeClass}`}>{stockStatus}</span>
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            title="Edit Material"
                            onClick={() => openEditModal(m)}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            title="Delete Material"
                            onClick={() => setDeleteId(m.id)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(8, 43, 58, 0.6)", backdropFilter: "blur(4px)", zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "16px" }}>
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold text-navy">
                  {modalMode === "create" ? "Add Site Material" : `Edit Material: ${currentMaterial?.name}`}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted">MATERIAL NAME *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Portland Pozzolana Cement (PPC)"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">CATEGORY</label>
                      <select
                        className="form-select"
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                      >
                        <option value="Structural">Structural</option>
                        <option value="Finishing">Finishing</option>
                        <option value="Electrical">Electrical</option>
                        <option value="Plumbing">Plumbing</option>
                        <option value="General">General</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">UNIT TYPE</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Bags / Tonnes / Sq.ft"
                        value={form.unit}
                        onChange={(e) => setForm({ ...form, unit: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">QUANTITY *</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="e.g. 500"
                        value={form.quantity}
                        onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">UNIT PRICE (INR ₹) *</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="e.g. 380"
                        value={form.unit_price}
                        onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top px-4 py-3">
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-saas-primary btn-sm" disabled={submitting}>
                    {submitting ? "Saving..." : modalMode === "create" ? "Add to Stock" : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={Boolean(deleteId)}
        title="Delete Material"
        message="Are you sure you want to remove this item from the site inventory?"
        confirmLabel="Confirm Delete"
        confirmVariant="danger"
        isProcessing={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}

