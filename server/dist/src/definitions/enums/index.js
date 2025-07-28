export var EMessageType;
(function (EMessageType) {
    EMessageType["PlainText"] = "text";
    // Rich Object can have images, images + text, for now
    EMessageType["RichObject"] = "rich_object";
})(EMessageType || (EMessageType = {}));
export var EEventType;
(function (EEventType) {
    EEventType["Organized"] = "organized";
    EEventType["Custom"] = "custom";
})(EEventType || (EEventType = {}));
export var EMediaProvider;
(function (EMediaProvider) {
    EMediaProvider["Local"] = "local";
    EMediaProvider["S3"] = "s3";
    EMediaProvider["GCS"] = "gcs";
    EMediaProvider["Cloudinary"] = "cloudinary";
    EMediaProvider["Supabase"] = "supabase";
})(EMediaProvider || (EMediaProvider = {}));
export var EMediaType;
(function (EMediaType) {
    EMediaType["Image"] = "image";
    EMediaType["Video"] = "video";
    EMediaType["Audio"] = "audio";
    EMediaType["Document"] = "document";
})(EMediaType || (EMediaType = {}));
export var EEventStatus;
(function (EEventStatus) {
    EEventStatus["Draft"] = "draft";
    EEventStatus["Upcoming"] = "upcoming";
    EEventStatus["Ongoing"] = "ongoing";
    EEventStatus["Completed"] = "completed";
    EEventStatus["Cancelled"] = "cancelled";
})(EEventStatus || (EEventStatus = {}));
export var EThreadType;
(function (EThreadType) {
    EThreadType["Discussion"] = "discussion";
    EThreadType["QnA"] = "qna";
})(EThreadType || (EThreadType = {}));
export var EAccessLevel;
(function (EAccessLevel) {
    EAccessLevel["Public"] = "public";
    EAccessLevel["Private"] = "private";
    EAccessLevel["Restricted"] = "restricted";
})(EAccessLevel || (EAccessLevel = {}));
export var EQueryOperator;
(function (EQueryOperator) {
    EQueryOperator["Eq"] = "eq";
    EQueryOperator["Neq"] = "neq";
    EQueryOperator["Gt"] = "gt";
    EQueryOperator["Gte"] = "gte";
    EQueryOperator["Lt"] = "lt";
    EQueryOperator["Lte"] = "lte";
    EQueryOperator["Like"] = "like";
    EQueryOperator["ILike"] = "ilike";
    EQueryOperator["In"] = "in";
    EQueryOperator["Is"] = "is";
})(EQueryOperator || (EQueryOperator = {}));
export var EAuthProvider;
(function (EAuthProvider) {
    EAuthProvider["Google"] = "google";
    EAuthProvider["Email"] = "email";
})(EAuthProvider || (EAuthProvider = {}));
export var EEventParticipantStatus;
(function (EEventParticipantStatus) {
    EEventParticipantStatus["Pending"] = "pending";
    EEventParticipantStatus["Confirmed"] = "confirmed";
    EEventParticipantStatus["Declined"] = "declined";
})(EEventParticipantStatus || (EEventParticipantStatus = {}));
//# sourceMappingURL=index.js.map