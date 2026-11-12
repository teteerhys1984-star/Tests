/**
 * Runs the exam's own audit of its question bank (src/exam/audit.ts, unchanged from the
 * original): 30 questions, 100 marks, valid keys, full marks for the model answers, zero for a
 * blank sheet. The audit prints its findings and sets a failing exit code on any error.
 */
import "../src/exam/audit";
