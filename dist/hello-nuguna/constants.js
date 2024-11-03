"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_RESPONSE_LIMIT = exports.FIELDS = exports.TABLES = void 0;
// src/hello-nuguna/constants.ts
exports.TABLES = {
    SOURCE_REPORT: 'source_report',
    PAGE_REPORT: 'page_report',
    EVENT_REPORT: 'event_report',
};
exports.FIELDS = {
    EVENT_DATE: 'event_date',
    SOURCE_MEDIUM: 'source_medium',
    CAMPAIGN: 'campaign',
    CONTENT: 'content',
    TERM: 'term',
    PAGE_LOCATION: 'page_location',
    USER_ID: 'user_id',
    SESSION: 'session',
};
exports.DEFAULT_RESPONSE_LIMIT = 10;
