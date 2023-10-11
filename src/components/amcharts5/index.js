import "./ext-amcharts5.component.js";
import Events from "#core/events";
import * as amcharts from "./loader.js";
import app from "#app";

Ext.define( "Ext.amcharts5", {
    "extend": "Ext.Container",
    "xtype": "amcharts5",

    "defaultBindProperty": "data",

    "root": null,
    "am5": amcharts.am5,

    "config": {
        "store": null,
        "createChart": null,
        "setChartData": null,
        "backupChartData": null,
        "restoreChartData": null,
        "animated": true,
        "responsive": true,
        "micro": null,
    },

    afterRender () {
        this._createChart();
    },

    doDestroy () {

        // unlink store
        this._unlinkStore( this.getStore() );

        // unlink theme
        this._events?.clear();
        this._events = null;

        // destroy chart
        this._destroyChart();

        this.callParent( arguments );
    },

    setStpre ( newValue, oldValue ) {
        this._unlinkStore( oldValue );

        this._linkStore( newValue );
    },

    setData ( data ) {
        if ( this.getSetChartData() ) {
            data = this.getSetChartData()( this, data );

            if ( data ) this._setData( data );
        }
        else {
            this._setData( data );
        }
    },

    _setData ( data ) {
        const chart = this.root.container.children.values[0];

        for ( const xAxis of chart.xAxes.values ) {
            xAxis.data.setAll( data || [] );
        }

        for ( const serie of chart.series ) {
            serie.data.setAll( data || [] );
        }
    },

    _backupData () {
        if ( this.getBackupChartData() ) {
            return this.getBackupChartData()( this );
        }
        else {
            const chart = this.root.container.children.values[0],
                data = {
                    "xAxes": [],
                    "series": [],
                };

            for ( const xAxis of chart.xAxes.values ) {
                data.xAxes.push( xAxis.data.values );
            }

            for ( const serie of chart.series ) {
                data.series.push( serie.data.values );
            }

            return data;
        }
    },

    _restoreData ( data ) {
        if ( this.getStore() ) {
            this._setDataFromStore();
        }
        else if ( this.getRestoreChartData() ) {
            this.getRestoreChartData()( this, data );
        }
        else if ( data ) {
            const chart = this.root.container.children.values[0];

            if ( data.xAxes?.length ) {
                for ( const xAxis of chart.xAxes.values ) {
                    xAxis.data.setAll( data.xAxes.shift() );
                }
            }

            if ( data.series?.length ) {
                for ( const serie of chart.series ) {
                    serie.data.setAll( data.series.shift() || [] );
                }
            }
        }
    },

    // XXX
    _createChart () {
        if ( this.root ) {
            var data = this._backupData();

            this._destroyChart();
        }

        this._events ??= new Events().link( app.theme ).on( "darkModeChange", this._onThemeChange.bind( this ) );

        this.root = amcharts.am5.Root.new( this.innerElement.dom );

        // set locale
        this.root.locale = amcharts.locale;
        this.root.dateFormatter.set( "intlLocales", app.locale.id );
        this.root.numberFormatter.set( "intlLocales", app.locale.id );

        const themes = [];

        if ( this.getAnimated() ) themes.push( amcharts.ThemeAnimated.new( this.root ) );
        if ( this.getResponsive() ) themes.push( amcharts.ThemeResponsive.new( this.root ) );
        if ( this.getMicro() ) themes.push( amcharts.ThemeMicro.new( this.root ) );

        // color theme
        if ( app.theme.darkMode ) {
            themes.push( amcharts.DarkTheme.new( this.root ) );
        }
        else {
            themes.push( amcharts.LightTheme.new( this.root ) );
        }

        this.root.setThemes( themes );

        this.getCreateChart()( this );

        // restore data
        this._restoreData( data );
    },

    _destroyChart () {
        if ( !this.root ) return;

        this.root.dispose();

        this.root = null;
    },

    _linkStore ( store ) {
        if ( !store ) return;

        store.on( {
            "scope": this,
            "dataChanged": this._setDataFromStore,
        } );

        this._setDataFromStore();
    },

    _unlinkStore ( store ) {
        if ( !store ) return;

        store.un( {
            "scope": this,
            "dataChanged": this._setDataFromStore,
        } );
    },

    _setDataFromStore () {
        const store = this.getStore();

        if ( !store ) return;

        if ( !this.root ) return;

        const data = Ext.Array.pluck( store.data.items, "data" );

        this.setData( data );
    },

    _onThemeChange () {
        if ( !this.root ) return;

        this._createChart();
    },
} );
