"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface GemRequest {
  id: string;
  requisitionNo: string;
  requestType: "CREATE" | "REPLACE";
  status: string;
  unitName: string;
  userName: string;
  userDesignation?: string;
  institutionalEmail: string;
  mobileNumber: string;
  aadharNumber?: string;
  dateOfBirth?: string;
  dateOfRetirement?: string;
  roleToAssign: string;
  hasExistingNicEmail: boolean;
  existingNicEmail?: string;
  oldGemId?: string;
  lastUserName?: string;
  idRequiredFor?: string;
  projectName?: string;
  fundedBy?: string;
  projectCode?: string;
  hodName?: string;
  hodDesignation?: string;
  hodPhone?: string;
  createdAt: string;
  department: { name: string; code: string };
  requestedBy: { name: string; email: string; designation?: string };
}

export default function GemRequestPrintPage() {
  const params = useParams();
  const id = params.id as string;
  const [req, setReq] = useState<GemRequest | null>(null);

  useEffect(() => {
    fetch(`/api/gem-requests/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setReq(data);
        setTimeout(() => window.print(), 800);
      })
      .catch(console.error);
  }, [id]);

  if (!req) {
    return (
      <div style={{ padding: "30px", textAlign: "center", color: "#888" }}>
        <p>Loading print view...</p>
      </div>
    );
  }

  const date = new Date(req.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const projectDetails = [
    req.projectName ? `Project: ${req.projectName}` : null,
    req.fundedBy ? `Funded By: ${req.fundedBy}` : null,
    req.projectCode ? `Code: ${req.projectCode}` : null,
  ]
    .filter(Boolean)
    .join(" | ");

  return (
    <>
      <style>{`
        @page {
          size: A4 portrait;
          margin: 10mm 13mm 8mm 13mm;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        html, body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 10.5pt;
          color: #000;
          background: #fff;
        }

        #no-print {
          position: fixed;
          top: 12px;
          right: 12px;
          z-index: 999;
        }

        #print-area {
          width: 100%;
          max-width: 184mm;
          margin: 0 auto;
        }

        .letterhead {
          text-align: center;
          border-bottom: 2px solid #1B4332;
          padding-bottom: 4px;
          margin-bottom: 7px;
        }

        .letterhead .university {
          font-size: 7.5pt;
          letter-spacing: 1.5px;
          color: #333;
          margin-bottom: 1px;
        }

        .letterhead h1 {
          font-size: 12.5pt;
          font-weight: bold;
          color: #1B4332;
          margin: 1px 0;
        }

        .letterhead .subtitle {
          font-size: 7.5pt;
          color: #555;
        }

        .address-block {
          margin-bottom: 5px;
          font-size: 9.5pt;
          line-height: 1.35;
        }

        .address-block p { margin: 0; }

        .subject-line {
          margin: 4px 0 2px;
          font-size: 9.5pt;
          padding-left: 14px;
        }

        .ref-line {
          font-size: 9.5pt;
          margin-bottom: 4px;
          padding-left: 14px;
        }

        .body-text {
          font-size: 9.5pt;
          margin-bottom: 5px;
          line-height: 1.35;
        }

        .details-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 6px;
          font-size: 9pt;
        }

        .details-table td {
          border: 1px solid #000;
          padding: 2.5px 6px;
          vertical-align: top;
          background: #fff !important;
        }

        .details-table .label {
          font-weight: bold;
          width: 42%;
          background: #fff !important;
        }

        .undertaking-box {
          border: 1px solid #000;
          padding: 4px 7px;
          margin-bottom: 5px;
          font-size: 8.5pt;
          line-height: 1.3;
          background: #fff !important;
        }

        .undertaking-box .ut-title {
          font-weight: bold;
          font-size: 9pt;
          margin-bottom: 2px;
          text-decoration: underline;
        }

        .undertaking-box ol {
          padding-left: 15px;
          margin: 2px 0 0;
        }

        .undertaking-box li {
          margin-bottom: 0.5px;
        }

        .signature-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 4px;
          font-size: 9pt;
        }

        .signature-table td {
          border: 1px solid #000;
          padding: 4px 7px;
          vertical-align: top;
          width: 50%;
          background: #fff !important;
        }

        .sig-space {
          height: 24px;
          display: block;
        }

        .footer-bar {
          text-align: center;
          font-size: 7pt;
          color: #666;
          border-top: 1px solid #ccc;
          padding-top: 2px;
          margin-top: 2px;
        }

        @media print {
          #no-print { display: none !important; }
          html, body {
            background: #fff !important;
            -webkit-print-color-adjust: economy;
            print-color-adjust: economy;
          }
          * {
            background: #fff !important;
            -webkit-print-color-adjust: economy;
            print-color-adjust: economy;
          }
          .details-table td,
          .details-table .label,
          .undertaking-box,
          .signature-table td {
            background: #fff !important;
          }
        }

        @media screen {
          body { background: #d8d8d8; }
          #print-area {
            background: #fff;
            padding: 13mm 11mm;
            margin: 20px auto;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          }
        }
      `}</style>

      {/* Screen-only Print button */}
      <div id="no-print">
        <button
          onClick={() => window.print()}
          style={{
            background: "#1B4332",
            color: "#fff",
            border: "none",
            padding: "8px 18px",
            borderRadius: "6px",
            cursor: "pointer",
            fontFamily: "sans-serif",
            fontSize: "13px",
            fontWeight: "bold",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
        >
          🖨 Print
        </button>
      </div>

      <div id="print-area">
        {/* Letterhead */}
        <div className="letterhead">
          <p className="university">ALIGARH MUSLIM UNIVERSITY, ALIGARH</p>
          <h1>CENTRAL PURCHASE OFFICE</h1>
          <p className="subtitle">GeM Portal User ID Request Form</p>
        </div>

        {/* Address */}
        <div className="address-block">
          <p>Assistant Finance Officer,</p>
          <p>Central Purchase Office,</p>
          <p>Aligarh Muslim University, Aligarh.</p>
        </div>

        <p className="subject-line">
          <strong>Subject:</strong> Request for GeM Portal User ID —{" "}
          {req.requestType === "CREATE" ? "New Creation" : "Replacement"} for {req.department.name}
        </p>
        <p className="ref-line">
          <strong>Ref. No.:</strong> {req.requisitionNo}&nbsp;&nbsp;&nbsp;
          <strong>Date:</strong> {date}
        </p>

        <p className="body-text">
          It is requested that the GeM Portal User ID may kindly be{" "}
          {req.requestType === "CREATE" ? "created" : "replaced"} for the following user:
        </p>

        {/* Details Table */}
        <table className="details-table">
          <tbody>
            <tr>
              <td className="label">Name of Unit/Department</td>
              <td>{req.unitName}</td>
            </tr>
            <tr>
              <td className="label">Name of User</td>
              <td>{req.userName}</td>
            </tr>
            <tr>
              <td className="label">User Designation</td>
              <td>{req.userDesignation || "—"}</td>
            </tr>
            <tr>
              <td className="label">Institutional Email ID</td>
              <td>{req.institutionalEmail}</td>
            </tr>
            <tr>
              <td className="label">Mobile Number (Aadhar Linked)</td>
              <td>{req.mobileNumber}</td>
            </tr>
            <tr>
              <td className="label">Aadhar Number</td>
              <td>{req.aadharNumber || "—"}</td>
            </tr>
            <tr>
              <td className="label">Date of Birth</td>
              <td>{req.dateOfBirth || "—"}</td>
            </tr>
            <tr>
              <td className="label">Date of Retirement</td>
              <td>{req.dateOfRetirement || "—"}</td>
            </tr>
            <tr>
              <td className="label">Role to be Assigned on GeM</td>
              <td>{req.roleToAssign}</td>
            </tr>
            <tr>
              <td className="label">Existing Govt./NIC Email</td>
              <td>{req.hasExistingNicEmail ? `Yes — ${req.existingNicEmail || ""}` : "No"}</td>
            </tr>
            <tr>
              <td className="label">Purpose / ID Required For</td>
              <td>{req.idRequiredFor || "—"}</td>
            </tr>
            {req.requestType === "REPLACE" && (
              <>
                <tr>
                  <td className="label">Old GeM ID</td>
                  <td>{req.oldGemId || "—"}</td>
                </tr>
                <tr>
                  <td className="label">Name of Previous User</td>
                  <td>{req.lastUserName || "—"}</td>
                </tr>
              </>
            )}
            {projectDetails && (
              <tr>
                <td className="label">Project Details</td>
                <td>{projectDetails}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Undertaking */}
        <div className="undertaking-box">
          <p className="ut-title">UNDERTAKING</p>
          <p>I/We hereby undertake that:</p>
          <ol>
            <li>The above-mentioned user is a bonafide employee of this department/office.</li>
            <li>The GeM Portal User ID shall be used exclusively for official procurement purposes only.</li>
            <li>The department shall immediately inform CPO in case of retirement, transfer, or resignation of the above user.</li>
            <li>The department shall be responsible for all transactions made using this User ID.</li>
            <li>The details provided above are correct to the best of my/our knowledge.</li>
          </ol>
        </div>

        {/* Signature Section */}
        <table className="signature-table">
          <tbody>
            <tr>
              <td>
                <span className="sig-space" />
                <div style={{ textAlign: "center" }}>
                  Signature of User<br />
                  <strong>{req.userName}</strong>
                </div>
              </td>
              <td>
                <div style={{ marginBottom: "6px" }}>Signature of HoD</div>
                <div><strong>Name:</strong> {req.hodName || "____________________________"}</div>
                <div><strong>Designation:</strong> {req.hodDesignation || "____________________________"}</div>
                <div><strong>Ext./Phone:</strong> {req.hodPhone || "____________________________"}</div>
                <div style={{ marginTop: "4px", fontStyle: "italic", color: "#555" }}>Seal:</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Footer */}
        <div className="footer-bar">
          CPO Portal • AMU Aligarh • Generated on {new Date().toLocaleString("en-IN")}
        </div>
      </div>
    </>
  );
}
