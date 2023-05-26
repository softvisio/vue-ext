export default Ext.define( "", {
    "extend": "Ext.data.Model",

    "proxy": {
        "api": {
            "read": "development/monitoring/read-method-exceptions",
        },
    },

    "fields": [

        // fields
        "method_id",
        { "name": "date", "type": "date" },
        "status",
        "status_text",
        "duration",
    ],
} );
