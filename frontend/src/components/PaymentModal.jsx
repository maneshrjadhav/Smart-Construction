import React, { useState, useEffect } from "react";
import { paymentService } from "../services/paymentService";
import { useToast } from "../context/ToastContext";
import { formatCurrency } from "../utils/currencyFormatter";

export default function PaymentModal({ show, onClose, worker, onPaymentRecorded, engineerAllocation }) {
  const { success: toastSuccess, error: toastError } = useToast();

  const [workingDays, setWorkingDays] = useState(26);
  const [dailyWage, setDailyWage] = useState(0);
  const [overtimeAmount, setOvertimeAmount] = useState(0);
  const [deductions, setDeductions] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [salaryPeriod, setSalaryPeriod] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (worker) {
      const wage = Number(worker.daily_wage || 0);
      setDailyWage(wage);
      const gross = 26 * wage;
      setAmountPaid(gross);
      setWorkingDays(26);
      setOvertimeAmount(0);
      setDeductions(0);
      setPaymentMethod(worker.payment_method || "Cash");
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const d = new Date();
      setSalaryPeriod(`${monthNames[d.getMonth()]} ${d.getFullYear()}`);
    }
  }, [worker]);

  if (!show || !worker) return null;

  // Real-time calculations
  const grossAmount = (Number(workingDays) * Number(dailyWage)) + Number(overtimeAmount);
  const netAmount = Math.max(0, grossAmount - Number(deductions));
  const remainingAmount = Math.max(0, netAmount - Number(amountPaid));

  const remainingBalance = engineerAllocation !== undefined ? Number(engineerAllocation) : null;
  const isOverBudget = remainingBalance !== null && Number(amountPaid) > remainingBalance;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Number(amountPaid) <= 0 && netAmount > 0) {
      toastError("Validation Error", "Amount paid must be greater than zero.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await paymentService.recordWorkerPayment({
        worker_id: worker.id,
        payment_date: paymentDate,
        salary_period: salaryPeriod,
        working_days: workingDays,
        daily_wage: dailyWage,
        overtime_amount: overtimeAmount,
        deductions: deductions,
        gross_amount: grossAmount,
        net_amount: netAmount,
        amount_paid: amountPaid,
        remaining_amount: remainingAmount,
        payment_method: paymentMethod,
        reference_number: referenceNumber,
        remarks: remarks
      });

      if (res.success) {
        toastSuccess("Payment Recorded", res.message || "Payment recorded successfully.");
        if (onPaymentRecorded) onPaymentRecorded(res.payment);
        onClose();
      }
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to record payment.";
      toastError("Payment Error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(15,23,42,0.6)", zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "16px", overflow: "hidden" }}>
          {/* Header */}
          <div className="modal-header text-white p-4" style={{ backgroundColor: "#0f172a" }}>
            <div>
              <span className="badge bg-info text-dark mb-1">Worker Payment Disbursement</span>
              <h5 className="modal-title fw-bold mb-0">
                Disburse Payment — {worker.name} ({worker.worker_code || `WRK-${worker.id}`})
              </h5>
              <small className="text-white-50">
                Trade: {worker.trade || worker.role} | Project: {worker.project_name || "Assigned Site"}
              </small>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} disabled={submitting}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4 bg-light">
              {/* Engineer Budget Allocation Alert */}
              {remainingBalance !== null && (
                <div className={`alert ${isOverBudget ? "alert-danger" : "alert-info"} d-flex align-items-center justify-content-between mb-4 shadow-sm border-0`}>
                  <div className="d-flex align-items-center gap-2">
                    <i className={`bi ${isOverBudget ? "bi-exclamation-triangle-fill" : "bi-wallet2"} fs-4`}></i>
                    <div>
                      <strong>Your Available Budget Allocation:</strong> {formatCurrency(remainingBalance)}
                      {isOverBudget && (
                        <div className="small text-danger fw-bold">
                          Warning: Payment amount ({formatCurrency(amountPaid)}) exceeds available allocation balance!
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="badge bg-dark">Server Enforced</span>
                </div>
              )}

              {/* Wage & Period Grid */}
              <div className="bg-white p-3 rounded-3 shadow-sm border mb-3">
                <h6 className="fw-bold text-navy mb-3">1. Wage &amp; Working Period</h6>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label small fw-bold">Salary / Wage Period</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Sep 2026 or 01-15 Sep"
                      value={salaryPeriod}
                      onChange={(e) => setSalaryPeriod(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-bold">Payment Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-bold">Daily Wage (₹)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={dailyWage}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setDailyWage(val);
                        setAmountPaid(workingDays * val + overtimeAmount - deductions);
                      }}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-bold">Working Days</label>
                    <input
                      type="number"
                      step="0.5"
                      className="form-control"
                      value={workingDays}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setWorkingDays(val);
                        setAmountPaid(val * dailyWage + overtimeAmount - deductions);
                      }}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-bold">Overtime Pay (₹)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={overtimeAmount}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setOvertimeAmount(val);
                        setAmountPaid(workingDays * dailyWage + val - deductions);
                      }}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-bold">Deductions (₹)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={deductions}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setDeductions(val);
                        setAmountPaid(workingDays * dailyWage + overtimeAmount - val);
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Calculation Summary Box */}
              <div className="p-3 rounded-3 mb-3 border" style={{ backgroundColor: "#f8fafc" }}>
                <div className="row text-center g-2">
                  <div className="col-3">
                    <small className="text-muted d-block">Gross Amount</small>
                    <span className="fw-bold fs-6 text-dark">{formatCurrency(grossAmount)}</span>
                  </div>
                  <div className="col-3">
                    <small className="text-muted d-block">Deductions</small>
                    <span className="fw-bold fs-6 text-danger">- {formatCurrency(deductions)}</span>
                  </div>
                  <div className="col-3">
                    <small className="text-muted d-block">Net Payable</small>
                    <span className="fw-bold fs-6 text-primary">{formatCurrency(netAmount)}</span>
                  </div>
                  <div className="col-3">
                    <small className="text-muted d-block">Remaining Balance</small>
                    <span className={`fw-bold fs-6 ${remainingAmount > 0 ? "text-warning" : "text-success"}`}>
                      {formatCurrency(remainingAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-white p-3 rounded-3 shadow-sm border">
                <h6 className="fw-bold text-navy mb-3">2. Disbursement Details</h6>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label small fw-bold">Amount to Pay Now (₹)</label>
                    <input
                      type="number"
                      className="form-control fw-bold text-success fs-6"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(Number(e.target.value))}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-bold">Payment Method</label>
                    <select
                      className="form-select"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="Cash">Cash</option>
                      <option value="Bank">Bank Transfer</option>
                      <option value="UPI">UPI</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-bold">Reference / Txn ID</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. UPI Ref / Cheque No"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-bold">Payment Remarks</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Optional notes regarding this payment disbursement"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer bg-white border-top p-3 d-flex justify-content-between">
              <div className="text-muted small">
                Status will be:{" "}
                <span className={`badge ${remainingAmount === 0 ? "bg-success" : "bg-warning text-dark"}`}>
                  {remainingAmount === 0 ? "Fully Paid" : "Partially Paid"}
                </span>
              </div>
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-outline-secondary px-4" onClick={onClose} disabled={submitting}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary px-4 fw-bold"
                  style={{ backgroundColor: "#0284c7", borderColor: "#0284c7" }}
                  disabled={submitting || isOverBudget}
                >
                  {submitting ? "Disbursing..." : `Record Payment (${formatCurrency(amountPaid)})`}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

