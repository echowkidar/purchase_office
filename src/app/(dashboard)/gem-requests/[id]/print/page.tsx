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
  institutionalEmail: string;
  mobileNumber: string;
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
      <div className="p-8 text-center text-gray-400">
        <p>Loading print view...</p>
      </div>
    );
  }

  const date = new Date(req.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; }
          #no-print { display: none !important; }
        }
        body { font-family: 'Times New Roman', serif; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #000; padding: 6px 10px; text-align: left; vertical-align: top; }
        th { background: #f0f0f0; font-weight: bold; }
        .field-label { font-weight: bold; width: 40%; }
      `}</style>

      {/* No-print button */}
      <div id="no-print" className="fixed top-4 right-4 z-50">
        <button
          onClick={() => window.print()}
          className="bg-green-700 text-white px-4 py-2 rounded-lg shadow text-sm font-medium"
        >
          🖨 Print
        </button>
      </div>

      <div id="print-area" style={{ maxWidth: "800px", margin: "0 auto", padding: "30px", fontSize: "13px", lineHeight: "1.5" }}>
        {/* Letterhead */}
        <div style={{ textAlign: "center", borderBottom: "2px solid #1B4332", paddingBottom: "12px", marginBottom: "20px" }}>
          <p style={{ fontSize: "11px", letterSpacing: "1px", color: "#555" }}>ALIGARH MUSLIM UNIVERSITY, ALIGARH</p>
          <h1 style={{ fontSize: "16px", fontWeight: "bold", margin: "4px 0", color: "#1B4332" }}>
            CENTRAL PURCHASE OFFICE
          </h1>
          <p style={{ fontSize: "11px", color: "#555" }}>GeM Portal User ID Request Form</p>
        </div>

        {/* Address & Date */}
        <div style={{ marginBottom: "20px" }}>
          <p style={{ fontWeight: "bold", marginBottom: "4px" }}>To,</p>
          <p>The Assistant Finance Officer,</p>
          <p>Central Purchase Office,</p>
          <p>Aligarh Muslim University,</p>
          <p>Aligarh.</p>
          <p style={{ marginTop: "10px" }}>
            <strong>Subject:</strong> Request for GeM Portal User ID —{" "}
            {req.requestType === "CREATE" ? "New Creation" : "Replacement"} for{" "}
            {req.department.name}
          </p>
          <p style={{ marginTop: "4px" }}>
            <strong>Ref. No.:</strong> {req.requisitionNo} &nbsp;&nbsp;&nbsp;{" "}
            <strong>Date:</strong> {date}
          </p>
        </div>

        <p style={{ marginBottom: "16px" }}>
          Sir/Madam,<br />
          With due respect, it is requested that the GeM Portal User ID may kindly be{" "}
          {req.requestType === "CREATE" ? "created" : "replaced"} for the following user:
        </p>

        {/* Details Table */}
        <table style={{ marginBottom: "20px" }}>
          <tbody>
            <tr>
              <td className="field-label">1. Name of Unit/Department</td>
              <td>{req.unitName}</td>
            </tr>
            <tr>
              <td className="field-label">2. Name of User</td>
              <td>{req.userName}</td>
            </tr>
            <tr>
              <td className="field-label">3. Institutional Email ID</td>
              <td>{req.institutionalEmail}</td>
            </tr>
            <tr>
              <td className="field-label">4. Mobile Number</td>
              <td>{req.mobileNumber}</td>
            </tr>
            <tr>
              <td className="field-label">5. Date of Birth</td>
              <td>{req.dateOfBirth || "—"}</td>
            </tr>
            <tr>
              <td className="field-label">6. Date of Retirement</td>
              <td>{req.dateOfRetirement || "—"}</td>
            </tr>
            <tr>
              <td className="field-label">7. Role to be Assigned on GeM</td>
              <td>{req.roleToAssign}</td>
            </tr>
            <tr>
              <td className="field-label">8. Existing Govt./NIC Email</td>
              <td>{req.hasExistingNicEmail ? `Yes — ${req.existingNicEmail || ""}` : "No"}</td>
            </tr>
            <tr>
              <td className="field-label">9. Purpose / ID Required For</td>
              <td>{req.idRequiredFor || "—"}</td>
            </tr>
            {req.requestType === "REPLACE" && (
              <>
                <tr>
                  <td className="field-label">10. Old GeM ID</td>
                  <td>{req.oldGemId || "—"}</td>
                </tr>
                <tr>
                  <td className="field-label">11. Name of Previous User</td>
                  <td>{req.lastUserName || "—"}</td>
                </tr>
              </>
            )}
            {(req.projectName || req.fundedBy || req.projectCode) && (
              <tr>
                <td className="field-label">12. Project Details</td>
                <td>
                  {req.projectName && <div>Project: {req.projectName}</div>}
                  {req.fundedBy && <div>Funded By: {req.fundedBy}</div>}
                  {req.projectCode && <div>Code: {req.projectCode}</div>}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Undertaking */}
        <div style={{ border: "1px solid #000", padding: "12px", marginBottom: "24px" }}>
          <p style={{ fontWeight: "bold", marginBottom: "8px" }}>UNDERTAKING</p>
          <p>I/We hereby undertake that:</p>
          <ol style={{ paddingLeft: "20px", margin: "8px 0" }}>
            <li>The above-mentioned user is a bonafide employee of this department/office.</li>
            <li>The GeM Portal User ID being requested shall be used exclusively for official procurement purposes only.</li>
            <li>The department shall immediately inform the Central Purchase Office in case of retirement, transfer, resignation, or any other change of status of the above user.</li>
            <li>The department shall be responsible for all transactions made using this User ID.</li>
            <li>The details provided above are correct to the best of my/our knowledge.</li>
          </ol>
        </div>

        {/* Signature Section */}
        <table style={{ marginBottom: "20px" }}>
          <tbody>
            <tr>
              <td style={{ width: "50%", border: "1px solid #000", padding: "60px 10px 10px", textAlign: "center" }}>
                Signature of User<br />
                <strong>{req.userName}</strong>
              </td>
              <td style={{ width: "50%", border: "1px solid #000", padding: "10px", verticalAlign: "top" }}>
                <div style={{ marginBottom: "40px" }}>Signature of HoD</div>
                <div><strong>Name:</strong> {req.hodName || "________________________"}</div>
                <div><strong>Designation:</strong> {req.hodDesignation || "________________________"}</div>
                <div><strong>Ext./Phone:</strong> {req.hodPhone || "________________________"}</div>
                <div style={{ marginTop: "10px", fontStyle: "italic" }}>Seal:</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Footer */}
        <div style={{ textAlign: "center", fontSize: "11px", color: "#555", borderTop: "1px solid #ccc", paddingTop: "10px" }}>
          CPO Portal • AMU Aligarh • Generated on {new Date().toLocaleString("en-IN")}
        </div>
      </div>
    </>
  );
}
