export const ROLES = Object.freeze({
  ADMIN: "admin",
  HR: "hr",
  MANAGER: "manager",
  EMPLOYEE: "employee",
});

export const ROLE_VALUES = Object.freeze(Object.values(ROLES));

export const TASK_STATUS = Object.freeze(["Pending", "In Progress", "Completed", "Overdue"]);
export const TASK_PRIORITY = Object.freeze(["Low", "Medium", "High", "Critical"]);

export const LEAVE_STATUS = Object.freeze(["Pending", "Approved", "Rejected"]);
export const PAYROLL_STATUS = Object.freeze(["Pending", "Processed", "Paid"]);

export const CANDIDATE_STATUS = Object.freeze(["Applied", "Screening", "Interview", "Offer", "Hired"]);
export const DOCUMENT_TYPES = Object.freeze(["Aadhar", "PAN", "Resume", "Certificates", "Other"]);
