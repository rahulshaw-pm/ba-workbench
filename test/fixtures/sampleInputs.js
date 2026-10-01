export const SAMPLE_INPUTS = {
  "requirements-elicitation": {
    rawNotes:
      "The system must allow managers to approve expense reports.\nPerformance should stay under 2 seconds per page load.\nNot sure how refunds should be handled yet.",
    projectName: "Expense Platform Revamp",
    stakeholders: ["Finance Lead", "Engineering Manager"],
    constraints: "Time-boxed",
    domainContext: "fintech expense management",
  },
  "stakeholder-raci": {
    projectName: "Expense Platform Revamp",
    stakeholders: ["Finance Lead", "Engineering Manager", "Compliance Officer"],
    activities: ["Approve scope changes", "Sign off on compliance review"],
    domainContext: "fintech expense management",
  },
  "business-case": {
    problemStatement: "Manual expense approval takes 5 days on average, delaying reimbursements and frustrating staff.",
    objectives: ["Reduce approval turnaround to 1 day", "Increase employee satisfaction with reimbursements"],
    targetUsers: "Employees and finance approvers",
    domainContext: "fintech expense management",
  },
  "user-story": {
    featureDescription: "Users should be able to upload a receipt photo. The system must auto-extract the amount and date.",
    persona: "employee",
    businessGoal: "I can submit expenses faster",
    domainContext: "fintech expense management",
  },
  "acceptance-criteria": {
    userStory: "As an employee, I want to upload a receipt photo, so that I can submit expenses faster.",
    businessRules: ["Only JPG/PNG/PDF files under 10MB are accepted"],
    includeEdgeCases: "Thorough (include negative + boundary cases)",
    domainContext: "fintech expense management",
  },
  "process-flow": {
    processName: "Expense Approval",
    processDescription:
      "Employee submits an expense report. Manager reviews the report. If the amount exceeds $500, finance must also approve. The system notifies the employee of the outcome.",
    domainContext: "fintech expense management",
  },
  "gap-risk-analysis": {
    currentState: "Approvals happen over email.\nNo audit trail exists.",
    desiredState: "Approvals happen in-app.\nEvery approval is logged with a timestamp.",
    domainContext: "fintech expense management",
  },
  "epic-decomposition": {
    epicDescription:
      "Build a mobile receipt capture flow. Support offline queuing. Auto-extract amount and date from the photo.",
    targetRelease: "Q2 Sprint 3",
    domainContext: "fintech expense management",
  },
  prioritization: {
    backlogItems: [
      "Must support JPG/PNG receipt uploads",
      "Should allow bulk export to CSV",
      "Could add dark mode to the approval dashboard",
    ],
    domainContext: "fintech expense management",
  },
  roadmap: {
    themes: ["Mobile receipt capture", "Finance audit trail", "Bulk export tooling"],
    horizon: "Next 2 Quarters",
    domainContext: "fintech expense management",
  },
  "meeting-minutes": {
    meetingTitle: "Expense Platform Kickoff",
    attendees: ["Priya (PM)", "Alex (Eng Lead)"],
    transcript:
      "We decided to prioritize mobile receipt capture first.\nAction: Alex will send the technical spike plan by Friday.\nGeneral discussion about budget constraints for Q2.",
    domainContext: "fintech expense management",
  },
  "release-notes": {
    releaseVersion: "v1.4.0",
    completedItems: [
      "Added mobile receipt capture",
      "Fixed CSV export timing out on large reports",
      "Improved approval dashboard load time",
    ],
    audience: "Customer-facing",
    domainContext: "fintech expense management",
  },
};
