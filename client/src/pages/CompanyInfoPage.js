import React from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/companyInfoPage.css";

const PAGE_CONTENT = {
  "/about-us": {
    title: "About Us",
    intro:
      "EmployeeHub is an employee management platform built to simplify attendance, leave tracking, and team operations in one place.",
    sections: [
      {
        heading: "Project Goal",
        text: "This project helps organizations manage employee workflows with role-based access for employees, managers, HR, and admins.",
      },
      {
        heading: "Core Features",
        text: "It includes dashboards, attendance capture and history, leave requests, and administrative controls for workforce operations.",
      },
      {
        heading: "Why We Built It",
        text: "The goal is to reduce manual process overhead and give teams a clear, reliable system for daily people operations.",
      },
    ],
  },
  "/careers": {
    title: "Careers",
    intro:
      "Thank you for your interest in joining EmployeeHub. We are focused on building better tools for workplace management.",
    sections: [
      {
        heading: "Current Openings",
        text: "There are no active openings at the moment.",
      },
      {
        heading: "Future Opportunities",
        text: "We periodically hire for frontend, backend, and product roles as the project grows.",
      },
      {
        heading: "Contact",
        text: "You can still share your profile at support@employeehub.com and we may reach out when relevant roles open.",
      },
    ],
  },
  "/privacy-policy": {
    title: "Privacy Policy",
    intro:
      "We value your privacy and handle employee data responsibly within the scope of this project.",
    sections: [
      {
        heading: "Data We Use",
        text: "We may process account details, attendance data, and leave records to provide core platform functionality.",
      },
      {
        heading: "How Data Is Used",
        text: "Data is used only for managing employee workflows, role access, and operational reporting.",
      },
      {
        heading: "Data Protection",
        text: "Access is role-based and limited to authorized users. Sensitive operations should be protected with secure authentication practices.",
      },
    ],
  },
  "/terms-of-service": {
    title: "Terms of Service",
    intro:
      "By using EmployeeHub, users agree to follow platform usage and access rules.",
    sections: [
      {
        heading: "Acceptable Use",
        text: "Users must use the platform for legitimate work-related purposes and avoid misuse of data or system access.",
      },
      {
        heading: "Account Responsibility",
        text: "Users are responsible for safeguarding login credentials and actions performed through their accounts.",
      },
      {
        heading: "Service Changes",
        text: "Features may be updated over time to improve reliability, security, and usability.",
      },
    ],
  },
};

function CompanyInfoPage() {
  const { pathname } = useLocation();
  const content = PAGE_CONTENT[pathname] || PAGE_CONTENT["/about-us"];

  return (
    <section className="company-page">
      <div className="company-page-card">
        <h1>{content.title}</h1>
        <p className="company-page-intro">{content.intro}</p>

        <div className="company-page-sections">
          {content.sections.map((section) => (
            <article className="company-page-section" key={section.heading}>
              <h2>{section.heading}</h2>
              <p>{section.text}</p>
            </article>
          ))}
        </div>

        <div className="company-page-actions">
          <Link to="/about-us">About Us</Link>
          <Link to="/careers">Careers</Link>
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/terms-of-service">Terms of Service</Link>
        </div>
      </div>
    </section>
  );
}

export default CompanyInfoPage;
