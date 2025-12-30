// AlertReportPDF.jsx
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

import logo from "../../assets/frontend/img/sonali-bank-logo.png";
import pdfIcon from "../../assets/frontend/img/icons8-pdf-40.png";

// optional: register fonts if you want specific fonts
// Font.register({ family: 'Helvetica', src: '...' });

const styles = StyleSheet.create({
  page: {
    fontSize: 10,
    paddingTop: 90, // leave space for fixed header
    paddingBottom: 64, // leave space for fixed footer
    paddingHorizontal: 28,
    fontFamily: "Helvetica",
    lineHeight: 1.2,
  },
  // fixed header repeated on every page
  header: {
    position: "absolute",
    top: 30,
    left: 28,
    right: 28,
    height: 55,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",

    // 🔽 Add these lines for underline
    borderBottom: "1px solid #dbd9d9",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  bankBlock: {
    flexDirection: "column",
    alignItems: "center", // <-- This centers the bank name + subtitle
    marginLeft: 0,
  },

  bankName: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 5,
  },
  logo: {
    width: 34,
    height: 34,
  },

  subtitle: {
    fontSize: 9,
    marginTop: 2,
  },
  title: {
    fontSize: 11,
    marginTop: 12,
    marginTop: 12,
    textDecoration: "underline",
    fontWeight: "bold",
    marginLeft: 10,
  },

  headerMeta: {
    marginTop: 10,
    marginBottom: 10,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8.5,
  },

  // footer fixed on every page
  footer: {
    position: "absolute",
    bottom: 18,
    left: 28,
    right: 28,
    height: 44,
    textAlign: "center",
    fontSize: 8.5,
    color: "#555",
    borderTop: "1px solid #dbd9d9",
    paddingTop: 5,
  },

  // content
  sectionTitle: {
    fontSize: 10,
    marginTop: 6,
    marginBottom: 4,
    textDecoration: "underline",
    color: "#b36b00", // amber-ish
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  twoCol: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 6,
  },
  colHalf: {
    width: "50%",
    paddingRight: 6,
    marginBottom: 4,
  },
  label: {
    fontSize: 9,
    fontWeight: "bold",
  },
  value: {
    fontSize: 9,
  },
  small: {
    fontSize: 8.5,
  },
  list: {
    marginTop: 4,
    marginLeft: 8,
  },
  evidenceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  evidenceIcon: {
    width: 14,
    height: 14,
    marginRight: 6,
  },
  sectionBlock: {
    marginBottom: 6,
  },
  underlineRole: {
    textDecoration: "underline",
    color: "#0487bf",
    fontSize: 9,
    marginBottom: 3,
  },
  pageNumber: {
    fontSize: 9,
    marginTop: 4,
    textAlign: "center",
    color: "#444",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    overflow: "visible",
    paddingVertical: 10,
  },
  stepWrapper: {
    flex: 1,
    alignItems: "center",
    position: "relative",
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#22c55e", // green-500
    borderWidth: 2,
    borderColor: "#16a34a", // green-600
    textAlign: "center",
    lineHeight: 20,
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    zIndex: 1,
  },
  line: {
    position: "absolute",
    top: 10, // circle center
    left: "50%",
    height: 2,
    backgroundColor: "#22c55e",
    zIndex: 0,
  },
  info: {
    marginTop: 5,
    textAlign: "center",
  },
  name: {
    fontSize: 9,
    color: "#4b5563", // gray-200
  },
  role: {
    fontSize: 8,
    color: "#4b5563", // gray-600
  },
});

const Header = ({ user }) => (
  <View style={styles.header} fixed>
    <View style={styles.headerRow}>
      <Image src={logo} style={styles.logo} />

      <View style={styles.bankBlock}>
        <Text style={styles.bankName}>Sonali Bank PLC</Text>
        <Text style={styles.subtitle}>
          Information Security, IT Risk Management & Fraud Control Division
        </Text>
      </View>
    </View>

    <Text style={styles.title}>Alert Report</Text>

    <View style={styles.headerMeta}>
      <Text style={styles.small}>
        <Text style={{ fontWeight: "bold" }}>Printing Time: </Text>
        {new Date().toLocaleString()}
      </Text>
      <Text style={[styles.small, { fontStyle: "italic" }]}>
        Printed By : {user?.name || "Unknown"}
      </Text>
    </View>
  </View>
);

const Footer = () => (
  <View style={styles.footer} fixed>
    <Text>Sonali Bank PLC, Head Office, Motijheel, Dhaka-1000, Bangladesh</Text>
    <Text>Phone: +880 2 9550426 | Website: www.sonalibank.com.bd</Text>

    {/* PAGE NUMBER HERE */}
    <Text
      style={styles.pageNumber}
      render={({ pageNumber, totalPages }) =>
        `Page ${pageNumber} of ${totalPages}`
      }
      fixed
    />
  </View>
);

const FieldPair = ({ label, value }) => (
  <View style={styles.colHalf}>
    <Text style={styles.label}>
      {label} <Text style={styles.value}>{value ?? "-"}</Text>{" "}
    </Text>
  </View>
);

const AlertReportPDF = ({ data = {}, user = {}, ref }) => {
  const sortedSteps = [...data.assignedTo].sort((a, b) => {
    if (a.role === "Level_1") return -1;
    if (b.role === "Level_1") return 1;
    return 0;
  });

  const fieldsToRender =
    Array.isArray(data.fieldsToFill) && data.fieldsToFill.length > 0
      ? data.fieldsToFill
      : [];

  const filteredFields = fieldsToRender.filter((field) => {
    const hasComments = field.comments?.trim() !== "";
    return (
      (field.isPerformed === "notPerformed" && hasComments) ||
      field.isPerformed === "performed" // matches your original logic (performed with/without comments)
    );
  });

  return (
    <Document ref={ref}>
      <Page size="A4" style={styles.page}>
        <Header user={user} />
        <Footer />

        {/* Main content */}
        <View>
          <Text style={styles.sectionTitle}>Alert's Basic Information :</Text>

          <View style={styles.twoCol}>
            <FieldPair label="Alert Name:" value={data.alertName} />
            <FieldPair label="Accepted Time:" value={data.acceptedTime} />
            <FieldPair label="Event Time:" value={data.eventTime} />
            <FieldPair label="Alert Source:" value={data.alertSource} />
            <FieldPair label="Severity:" value={data.severity} />
            <FieldPair label="Verdict:" value={data.verdict} />
            <FieldPair
              label="Affected User Device:"
              value={data.affectedUserDevice}
            />
            <FieldPair
              label="Affected IP/Website:"
              value={data.affectedIpWebsite}
            />
          </View>

          {/* Other Division Informed */}
          {fieldsToRender.length > 0 && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Other Division Informed :</Text>

              {fieldsToRender.map((field, idx) => (
                <View key={field._id || idx} style={{ marginBottom: 6 }}>
                  <Text style={styles.label}>
                    {`${
                      field.role || "Unknown Role"
                    }: Need to Perform requested Actions below`}
                  </Text>

                  <View style={styles.list}>
                    <Text style={styles.value}>
                      • {field.value || "No action provided"}
                    </Text>
                  </View>
                </View>
              ))}

              {/* Previous Action Performed History */}
              {filteredFields.length > 0 && (
                <View style={{ marginTop: 6 }}>
                  <Text style={styles.sectionTitle}>
                    Previous Action Performed History :
                  </Text>

                  {filteredFields.map((field, index) => (
                    <View key={field._id || index} style={{ marginBottom: 6 }}>
                      <Text style={styles.underlineRole}>{field.role} :</Text>

                      <View style={styles.twoCol}>
                        <View style={{ width: "100%" }}>
                          <Text style={styles.label}>
                            Action Performed:{" "}
                            <Text style={styles.value}>
                              {field.isPerformed}
                            </Text>{" "}
                          </Text>
                        </View>
                        <View style={{ width: "100%" }}>
                          <Text style={styles.label}>
                            Comments:{" "}
                            <Text style={styles.value}>
                              {field.comments || "No Comments"}
                            </Text>
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {user.branch ===
            "99341-Information Security, IT Risk Management & Fraud Control Division" && (
            <>
              {/* stepper start */}

              <View style={styles.container}>
                {sortedSteps.map((step, index) => (
                  <View key={index} style={styles.stepWrapper}>
                    {/* Line connecting to next */}
                    {index < sortedSteps.length - 1 && (
                      <View style={[styles.line, { width: "100%" }]} />
                    )}

                    {/* Circle with check */}
                    <Text style={styles.circle}>✓</Text>

                    {/* Info */}
                    <View style={styles.info}>
                      <Text style={styles.name}>{step.name}</Text>
                      <Text style={styles.role}>{step.role}</Text>
                      <Text style={styles.acceptedAt}>{step.acceptedAt}</Text>
                    </View>
                  </View>
                ))}
              </View>
              {/* stepper end */}

              {/* false positive */}
              {data.verdict === "false_positive" && (
                <View style={styles.sectionBlock}>
                  {data.fpNote && (
                    <>
                      <Text style={styles.sectionTitle}>FP Closure Note :</Text>
                      <Text style={styles.value}>{data.fpNote}</Text>
                    </>
                  )}
                </View>
              )}

              {/* true positive */}
              {data.verdict === "true_positive" && (
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionTitle}>
                    True Positive Case Details :
                  </Text>

                  <Text style={styles.label}>
                    Case Details:{" "}
                    <Text style={styles.value}>{data.caseDetails}</Text>
                  </Text>

                  {Array.isArray(data.uploadedEvidence) &&
                    data.uploadedEvidence.length > 0 && (
                      <View style={{ marginTop: 6, marginBottom: 6 }}>
                        <Text style={styles.label}>Uploaded Evidence:</Text>
                        <View style={{ marginTop: 4 }}>
                          {data.uploadedEvidence.map((file, i) => (
                            <View key={i} style={styles.evidenceRow}>
                              <Image
                                src={pdfIcon}
                                style={styles.evidenceIcon}
                              />
                              <Text style={styles.small}>
                                {file?.split("_").pop() || file}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                  <Text style={{ marginTop: 6 }}>
                    <Text style={styles.label}>TP Impact: </Text>
                    <Text style={styles.value}>{data.tpImpact}</Text>
                  </Text>

                  <Text style={{ marginTop: 4 }}>
                    <Text style={styles.label}>TP Remediation Actions: </Text>
                    <Text style={styles.value}>{data.tpRemedationNote}</Text>
                  </Text>

                  <Text style={{ marginTop: 4 }}>
                    <Text style={styles.label}>Escalation: </Text>
                    <Text style={styles.value}>{data.escalation}</Text>
                  </Text>

                  <Text style={{ marginTop: 4 }}>
                    <Text style={styles.label}>Escalation Reason: </Text>
                    <Text style={styles.value}>{data.escalationReason}</Text>
                  </Text>

                  {/* L2 Processing Area */}
                  {data.escalation === "yes" && (
                    <View style={{ marginTop: 6 }}>
                      {data.investigationFindings && (
                        <>
                          <Text style={styles.sectionTitle}>
                            L2 Processing Area :
                          </Text>

                          <Text style={styles.label}>
                            Investigation Findings :{" "}
                            <Text style={styles.value}>
                              {data.investigationFindings}
                            </Text>
                          </Text>

                          <Text style={{ marginTop: 4 }}>
                            <Text style={styles.label}>
                              Investigation Methodology and Tools :{" "}
                            </Text>
                            <Text style={styles.value}>
                              {data.investigationToolsUsed}
                            </Text>
                          </Text>

                          <Text style={{ marginTop: 4 }}>
                            <Text style={styles.label}>L2 Verdict: </Text>
                            <Text style={styles.value}>
                              {data.L2verdict === "true_positive"
                                ? "True Positive"
                                : "False Positive"}
                            </Text>
                          </Text>
                        </>
                      )}

                      {data.L2verdict === "true_positive" && (
                        <Text style={{ marginTop: 4 }}>
                          <Text style={styles.label}>
                            Incident Declaration Required:{" "}
                          </Text>
                          <Text style={styles.value}>
                            {data.incidentDeclarationRequired}
                          </Text>
                        </Text>
                      )}

                      {data.incidentDeclarationRequired === "no" && (
                        <>
                          <Text style={{ marginTop: 4 }}>
                            <Text style={styles.label}>
                              L2 Remediation Plan:{" "}
                            </Text>
                            <Text style={styles.value}>
                              {data.l2RemediationPlan}
                            </Text>
                          </Text>
                          <Text style={{ marginTop: 4 }}>
                            <Text style={styles.label}>
                              L2 Remediation Validation:{" "}
                            </Text>
                            <Text style={styles.value}>
                              {data.l2RemediationValidation}
                            </Text>
                          </Text>
                          <Text style={{ marginTop: 4 }}>
                            <Text style={styles.label}>
                              Hand Back Note to L1 Assignee:{" "}
                            </Text>
                            <Text style={styles.value}>
                              {data.handBackNoteToL1}
                            </Text>
                          </Text>
                        </>
                      )}

                      {data.incidentDeclarationRequired === "yes" && (
                        <>
                          <Text style={{ marginTop: 4 }}>
                            <Text style={styles.label}>
                              Incident Declaration Reason:{" "}
                            </Text>
                            <Text style={styles.value}>
                              {data.incidentDeclarationReason}
                            </Text>
                          </Text>

                          <Text style={{ marginTop: 4 }}>
                            <Text style={styles.label}>Incident: </Text>
                            <Text style={styles.value}>{data.isIncidence}</Text>
                          </Text>

                          {data.isIncidence === "no" && (
                            <>
                              <Text style={{ marginTop: 4 }}>
                                <Text style={styles.label}>
                                  L2 Remediation Plan:{" "}
                                </Text>
                                <Text style={styles.value}>
                                  {data.l2RemediationPlan}
                                </Text>
                              </Text>
                              <Text style={{ marginTop: 4 }}>
                                <Text style={styles.label}>
                                  L2 Remediation Validation:{" "}
                                </Text>
                                <Text style={styles.value}>
                                  {data.l2RemediationValidation}
                                </Text>
                              </Text>
                              <Text style={{ marginTop: 4 }}>
                                <Text style={styles.label}>
                                  Hand Back Note to L1 Assignee:{" "}
                                </Text>
                                <Text style={styles.value}>
                                  {data.handBackNoteToL1}
                                </Text>
                              </Text>
                            </>
                          )}

                          {data.isIncidence === "yes" && (
                            <>
                              <Text style={styles.sectionTitle}>
                                Details Information of Incidence and Remediation
                                :
                              </Text>
                              <Text style={{ marginTop: 4 }}>
                                <Text style={styles.label}>IRP: </Text>
                                <Text style={styles.value}>{data.irp}</Text>
                              </Text>
                              <Text style={{ marginTop: 4 }}>
                                <Text style={styles.label}>
                                  L2 Root Cause Analysis:{" "}
                                </Text>
                                <Text style={styles.value}>
                                  {data.rootCause}
                                </Text>
                              </Text>
                              <Text style={{ marginTop: 4 }}>
                                <Text style={styles.label}>
                                  L2 Remediation Plan:{" "}
                                </Text>
                                <Text style={styles.value}>
                                  {data.l2RemediationPlan}
                                </Text>
                              </Text>
                              <Text style={{ marginTop: 4 }}>
                                <Text style={styles.label}>
                                  L2 Remediation Validation:{" "}
                                </Text>
                                <Text style={styles.value}>
                                  {data.l2RemediationValidation}
                                </Text>
                              </Text>
                              <Text style={{ marginTop: 4 }}>
                                <Text style={styles.label}>
                                  Hand Back Note to L1 Assignee:{" "}
                                </Text>
                                <Text style={styles.value}>
                                  {data.handBackNoteToL1}
                                </Text>
                              </Text>
                            </>
                          )}
                        </>
                      )}
                    </View>
                  )}
                </View>
              )}
            </>
          )}
        </View>
      </Page>
    </Document>
  );
};

export default AlertReportPDF;
