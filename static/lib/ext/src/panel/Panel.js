/**
 * @class Ext.panel.Panel
 * @extends Ext.panel.AbstractPanel
 * <p>Panel is a container that has specific functionality and structural components that make
 * it the perfect building block for application-oriented user interfaces.</p>
 * <p>Panels are, by virtue of their inheritance from {@link Ext.container.Container}, capable
 * of being configured with a {@link Ext.container.Container#layout layout}, and containing child Components.</p>
 * <p>When either specifying child {@link Ext.Component#items items} of a Panel, or dynamically {@link Ext.container.Container#add adding} Components
 * to a Panel, remember to consider how you wish the Panel to arrange those child elements, and whether
 * those child elements need to be sized using one of Ext&#39;s built-in <code><b>{@link Ext.container.Container#layout layout}</b></code> schemes. By
 * default, Panels use the {@link Ext.layout.container.Auto Auto} scheme. This simply renders
 * child components, appending them one after the other inside the Container, and <b>does not apply any sizing</b>
 * at all.</p>
 * {@img Ext.panel.Panel/panel.png Panel components}
 * <p>A Panel may also contain {@link #bbar bottom} and {@link #tbar top} toolbars, along with separate
 * {@link #header}, {@link #footer} and {@link #body} sections (see {@link #frame} for additional
 * information).</p>
 * <p>Panel also provides built-in {@link #collapsible collapsible, expandable} and {@link #closable} behavior.
 * Panels can be easily dropped into any {@link Ext.container.Container Container} or layout, and the
 * layout and rendering pipeline is {@link Ext.container.Container#add completely managed by the framework}.</p>
 * <p><b>Note:</b> By default, the <code>{@link #closable close}</code> header tool <i>destroys</i> the Panel resulting in removal of the Panel
 * and the destruction of any descendant Components. This makes the Panel object, and all its descendants <b>unusable</b>. To enable the close
 * tool to simply <i>hide</i> a Panel for later re-use, configure the Panel with <b><code>{@link #closeAction closeAction: 'hide'}</code></b>.</p>
 * <p>Usually, Panels are used as constituents within an application, in which case, they would be used as child items of Containers,
 * and would themselves use Ext.Components as child {@link #items}. However to illustrate simply rendering a Panel into the document,
 * here&#39;s how to do it:<pre><code>
Ext.create('Ext.panel.Panel', {
    title: 'Hello',
    width: 200,
    html: '&lt;p&gt;World!&lt;/p&gt;',
    renderTo: document.body
});
</code></pre></p>
 * <p>A more realistic scenario is a Panel created to house input fields which will not be rendered, but used as a constituent part of a Container:<pre><code>
var filterPanel = Ext.create('Ext.panel.Panel', {
    bodyPadding: 5,  // Don&#39;t want content to crunch against the borders
    title: 'Filters',
    items: [{
        xtype: 'datefield',
        fieldLabel: 'Start date'
    }, {
        xtype: 'datefield',
        fieldLabel: 'End date'
    }]
});
</code></pre></p>
 * <p>Note that the Panel above is not configured to render into the document, nor is it configured with a size or position. In a real world scenario,
 * the Container into which the Panel is added will use a {@link #layout} to render, size and position its child Components.</p>
 * <p>Panels will often use specific {@link #layout}s to provide an application with shape and structure by containing and arranging child
 * Components: <pre><code>
var resultsPanel = Ext.create('Ext.panel.Panel', {
    title: 'Results',
    width: 600,
    height: 400,
    renderTo: document.body,
    layout: {
        type: 'vbox',       // Arrange child items vertically
        align: 'stretch',    // Each takes up full width
        padding: 5
    },
    items: [{               // Results grid specified as a config object with an xtype of 'grid'
        xtype: 'grid',
        columns: [{header: 'Column One'}],            // One header just for show. There&#39;s no data,
        store: Ext.create('Ext.data.ArrayStore', {}), // A dummy empty data store
        flex: 1                                       // Use 1/3 of Container&#39;s height (hint to Box layout)
    }, {
        xtype: 'splitter'   // A splitter between the two child items
    }, {                    // Details Panel specified as a config object (no xtype defaults to 'panel').
        title: 'Details',
        bodyPadding: 5,
        items: [{
            fieldLabel: 'Data item',
            xtype: 'textfield'
        }], // An array of form fields
        flex: 2             // Use 2/3 of Container&#39;s height (hint to Box layout)
    }]
});
</code></pre>
 * The example illustrates one possible method of displaying search results. The Panel contains a grid with the resulting data arranged
 * in rows. Each selected row may be displayed in detail in the Panel below. The {@link Ext.layout.container.VBox vbox} layout is used
 * to arrange the two vertically. It is configured to stretch child items horizontally to full width. Child items may either be configured
 * with a numeric height, or with a <code>flex</code> value to distribute available space proportionately.</p>
 * <p>This Panel itself may be a child item of, for exaple, a {@link Ext.tab.Panel} which will size its child items to fit within its
 * content area.</p>
 * <p>Using these techniques, as long as the <b>layout</b> is chosen and configured correctly, an application may have any level of
 * nested containment, all dynamically sized according to configuration, the user&#39;s preference and available browser size.</p>
 * @constructor
 * @param {Object} config The config object
 * @xtype panel
 */
Ext.define('Ext.panel.Panel', {
    extend: 'Ext.panel.AbstractPanel',
    requires: [
        'Ext.panel.Header',
        'Ext.fx.Anim',
        'Ext.util.KeyMap',
        'Ext.panel.DD',
        'Ext.XTemplate',
        'Ext.layout.component.Dock'
    ],
    alias: 'widget.panel',
    alternateClassName: 'Ext.Panel',

    /**
     * @cfg {String} collapsedCls
     * A CSS class to add to the panel&#39;s element after it has been collapsed (defaults to
     * <code>'collapsed'</code>).
     */
    collapsedCls: 'collapsed',

    /**
     * @cfg {Boolean} animCollapse
     * <code>true</code> to animate the transition when the panel is collapsed, <code>false</code> to skip the
     * animation (defaults to <code>true</code> if the {@link Ext.fx.Anim} class is available, otherwise <code>false</code>).
     * May also be specified as the animation duration in milliseconds.
     */
    animCollapse: Ext.enableFx,

    /**
     * @cfg {Number} minButtonWidth
     * Minimum width of all footer toolbar buttons in pixels (defaults to <tt>75</tt>). If set, this will
     * be used as the default value for the <tt>{@link Ext.button.Button#minWidth}</tt> config of
     * each Button added to the <b>footer toolbar</b> via the {@link #fbar} or {@link #buttons} configurations.
     * It will be ignored for buttons that have a minWidth configured some other way, e.g. in their own config
     * object or via the {@link Ext.container.Container#config-defaults defaults} of their parent container.
     */
    minButtonWidth: 75,

    /**
     * @cfg {Boolean} collapsed
     * <code>true</code> to render the panel collapsed, <code>false</code> to render it expanded (defaults to
     * <code>false</code>).
     */
    collapsed: false,

    /**
     * @cfg {Boolean} collapseFirst
     * <code>true</code> to make sure the collapse/expand toggle button always renders first (to the left of)
     * any other tools in the panel&#39;s title bar, <code>false</code> to render it last (defaults to <code>true</code>).
     */
    collapseFirst: true,

    /**
     * @cfg {Boolean} hideCollapseTool
     * <code>true</code> to hide the expand/collapse toggle button when <code>{@link #collapsible} == true</code>,
     * <code>false</code> to display it (defaults to <code>false</code>).
     */
    hideCollapseTool: false,

    /**
     * @cfg {Boolean} titleCollapse
     * <code>true</code> to allow expanding and collapsing the panel (when <code>{@link #collapsible} = true</code>)
     * by clicking anywhere in the header bar, <code>false</code>) to allow it only by clicking to tool button
     * (defaults to <code>false</code>)).
     */
    titleCollapse: false,

    /**
     * @cfg {String} collapseMode
     * <p><b>Important: this config is only effective for {@link #collapsible} Panels which are direct child items of a {@link Ext.layout.container.Border border layout}.</b></p>
     * <p>When <i>not</i> a direct child item of a {@link Ext.layout.container.Border border layout}, then the Panel&#39;s header remains visible, and the body is collapsed to zero dimensions.
     * If the Panel has no header, then a new header (orientated correctly depending on the {@link #collapseDirection}) will be inserted to show a the title and a re-expand tool.</p>
     * <p>When a child item of a {@link Ext.layout.container.Border border layout}, this config has two options:
     * <div class="mdetail-params"><ul>
     * <li><b><code>undefined/omitted</code></b><div class="sub-desc">When collapsed, a placeholder {@link Ext.panel.Header Header} is injected into the layout to represent the Panel
     * and to provide a UI with a Tool to allow the user to re-expand the Panel.</div></li>
     * <li><b><code>header</code></b> : <div class="sub-desc">The Panel collapses to leave its header visible as when not inside a {@link Ext.layout.container.Border border layout}.</div></li>
     * </ul></div></p>
     */

    /**
     * @cfg {Mixed} placeholder
     * <p><b>Important: This config is only effective for {@link #collapsible} Panels which are direct child items of a {@link Ext.layout.container.Border border layout}
     * when not using the <code>'header'</code> {@link #collapseMode}.</b></p>
     * <p><b>Optional.</b> A Component (or config object for a Component) to show in place of this Panel when this Panel is collapsed by a
     * {@link Ext.layout.container.Border border layout}. Defaults to a generated {@link Ext.panel.Header Header}
     * containing a {@link Ext.panel.Tool Tool} to re-expand the Panel.</p>
     */

    /**
     * @cfg {Boolean} floatable
     * <p><b>Important: This config is only effective for {@link #collapsible} Panels which are direct child items of a {@link Ext.layout.container.Border border layout}.</b></p>
     * <tt>true</tt> to allow clicking a collapsed Panel&#39;s {@link #placeholder} to display the Panel floated
     * above the layout, <tt>false</tt> to force the user to fully expand a collapsed region by
     * clicking the expand button to see it again (defaults to <tt>true</tt>).
     */
    floatable: true,
    
    /**
     * @cfg {Mixed} overlapHeader
     * True to overlap the header in a panel over the framing of the panel itself. This is needed when frame:true (and is done automatically for you). Otherwise it is undefined.
     * If you manually add rounded corners to a panel header which does not have frame:true, this will need to be set to true.
     */
    
    /**
     * @cfg {Boolean} collapsible
     * <p>True to make the panel collapsible and have an expand/collapse toggle Tool added into
     * the header tool button area. False to keep the panel sized either statically, or by an owning layout manager, with no toggle Tool (defaults to false).</p>
     * See {@link #collapseMode} and {@link #collapseDirection}
     */
    collapsible: false,

    /**
     * @cfg {Boolean} collapseDirection
     * <p>The direction to collapse the Panel when the toggle button is clicked.</p>
     * <p>Defaults to the {@link #headerPosition}</p>
     * <p><b>Important: This config is <u>ignored</u> for {@link #collapsible} Panels which are direct child items of a {@link Ext.layout.container.Border border layout}.</b></p>
     * <p>Specify as <code>'top'</code>, <code>'bottom'</code>, <code>'left'</code> or <code>'right'</code>.</p>
     */

    /**
     * @cfg {Boolean} closable
     * <p>True to display the 'close' tool button and allow the user to close the window, false to
     * hide the button and disallow closing the window (defaults to <code>false</code>).</p>
     * <p>By default, when close is requested by clicking the close button in the header, the {@link #close}
     * method will be called. This will <i>{@link Ext.Component#destroy destroy}</i> the Panel and its content
     * meaning that it may not be reused.</p>
     * <p>To make closing a Panel <i>hide</i> the Panel so that it may be reused, set
     * {@link #closeAction} to 'hide'.</p>
     */
    closable: false,

    /**
     * @cfg {String} closeAction
     * <p>The action to take when the close header tool is clicked:
     * <div class="mdetail-params"><ul>
     * <li><b><code>'{@link #destroy}'</code></b> : <b>Default</b><div class="sub-desc">
     * {@link #destroy remove} the window from the DOM and {@link Ext.Component#destroy destroy}
     * it and all descendant Components. The window will <b>not</b> be available to be
     * redisplayed via the {@link #show} method.
     * </div></li>
     * <li><b><code>'{@link #hide}'</code></b> : <div class="sub-desc">
     * {@link #hide} the window by setting visibility to hidden and applying negative offsets.
     * The window will be available to be redisplayed via the {@link #show} method.
     * </div></li>
     * </ul></div>
     * <p><b>Note:</b> This behavior has changed! setting *does* affect the {@link #close} method
     * which will invoke the approriate closeAction.
     */
    closeAction: 'destroy',

    /**
     * @cfg {Object/Array} dockedItems
     * A component or series of components to be added as docked items to this panel.
     * The docked items can be docked to either the top, right, left or bottom of a panel.
     * This is typically used for things like toolbars or tab bars:
     * <pre><code>
var panel = new Ext.panel.Panel({
    dockedItems: [{
        xtype: 'toolbar',
        dock: 'top',
        items: [{
            text: 'Docked to the top'
        }]
    }]
});</pre></code>
     */

    /**
      * @cfg {Boolean} preventHeader Prevent a Header from being created and shown. Defaults to false.
      */
    preventHeader: false,

     /**
      * @cfg {String} headerPosition Specify as <code>'top'</code>, <code>'bottom'</code>, <code>'left'</code> or <code>'right'</code>. Defaults to <code>'top'</code>.
      */
    headerPosition: 'top',

     /**
     * @cfg {Boolean} frame
     * True to apply a frame to the panel.
     */
    frame: false,

    /**
     * @cfg {Boolean} frameHeader
     * True to apply a frame to the panel panels header (if 'frame' is true).
     */
    frameHeader: true,

    /**
     * @cfg {Array} tools
     * An array of {@link Ext.panel.Tool} configs/instances to be added to the header tool area. The tools are stored as child
     * components of the header container. They can be accessed using {@link #down} and {#query}, as well as the other
     * component methods. The toggle tool is automatically created if {@link #collapsible} is set to true.
     * <p>Note that, apart from the toggle tool which is provided when a panel is collapsible, these
     * tools only provide the visual button. Any required functionality must be provided by adding
     * handlers that implement the necessary behavior.</p>
     * <p>Example usage:</p>
     * <pre><code>
tools:[{
    type:'refresh',
    qtip: 'Refresh form Data',
    // hidden:true,
    handler: function(event, toolEl, panel){
        // refresh logic
    }
},
{
    type:'help',
    qtip: 'Get Help',
    handler: function(event, toolEl, panel){
        // show help here
    }
}]
</code></pre>
     */


    initComponent: function() {
        var me = this,
            cls;

        me.addEvents(
        /**
         * @event titlechange
         * Fires after the Panel title has been set or changed.
         * @param {Ext.panel.Panel} p the Panel which has been resized.
         * @param {String} newTitle The new title.
         * @param {String} oldTitle The previous panel title.
         */
            'titlechange',
        /**
         * @event iconchange
         * Fires after the Panel iconCls has been set or changed.
         * @param {Ext.panel.Panel} p the Panel which has been resized.
         * @param {String} newIconCls The new iconCls.
         * @param {String} oldIconCls The previous panel iconCls.
         */
            'iconchange'
        );

        if (me.unstyled) {
            me.setUI('plain');
        }

        if (me.frame) {
            me.setUI('default-framed');
        }

        me.callParent();

        me.collapseDirection = me.collapseDirection || me.headerPosition || Ext.Component.DIRECTION_TOP;

        // Backwards compatibility
        me.bridgeToolbars();
    },

    setBorder: function(border) {
        // var me     = this,
        //     method = (border === false || border === 0) ? 'addClsWithUI' : 'removeClsWithUI';
        // 
        // me.callParent(arguments);
        // 
        // if (me.collapsed) {
        //     me[method](me.collapsedCls + '-noborder');
        // }
        // 
        // if (me.header) {
        //     me.header.setBorder(border);
        //     if (me.collapsed) {
        //         me.header[method](me.collapsedCls + '-noborder');
        //     }
        // }
        
        this.callParent(arguments);
    },

    beforeDestroy: function() {
        Ext.destroy(
            this.ghostPanel,
            this.dd
        );
        this.callParent();
    },

    initAria: function() {
        this.callParent();
        this.initHeaderAria();
    },

    initHeaderAria: function() {
        var me = this,
            el = me.el,
            header = me.header;
        if (el && header) {
            el.dom.setAttribute('aria-labelledby', header.titleCmp.id);
        }
    },

    getHeader: function() {
        return this.header;
    },

    /**
     * Set a title for the panel&#39;s header. See {@link Ext.panel.Header#title}.
     * @param {String} newTitle
     */
    setTitle: function(newTitle) {
        var me = this,
        oldTitle = this.title;

        me.title = newTitle;
        if (me.header) {
            me.header.setTitle(newTitle);
        } else {
            me.updateHeader();
        }

        if (me.reExpander) {
            me.reExpander.setTitle(newTitle);
        }
        me.fireEvent('titlechange', me, newTitle, oldTitle);
    },

    /**
     * Set the iconCls for the panel&#39;s header. See {@link Ext.panel.Header#iconCls}.
     * @param {String} newIconCls
     */
    setIconCls: function(newIconCls) {
        var me = this,
            oldIconCls = me.iconCls;

        me.iconCls = newIconCls;
        var header = me.header;
        if (header) {
            header.setIconCls(newIconCls);
        }
        me.fireEvent('iconchange', me, newIconCls, oldIconCls);
    },

    bridgeToolbars: function() {
        var me = this,
            fbar,
            fbarDefaults,
            minButtonWidth = me.minButtonWidth;

        function initToolbar (toolbar, pos) {
            if (Ext.isArray(toolbar)) {
                toolbar = {
                    xtype: 'toolbar',
                    items: toolbar
                };
            }
            else if (!toolbar.xtype) {
                toolbar.xtype = 'toolbar';
            }
            toolbar.dock = pos;
            if (pos == 'left' || pos == 'right') {
                toolbar.vertical = true;
            }
            return toolbar;
        }

        // Backwards compatibility

        /**
         * @cfg {Object/Array} tbar

Convenience method. Short for 'Top Bar'.

    tbar: [
      { xtype: 'button', text: 'Button 1' }
    ]

is equivalent to

    dockedItems: [{
        xtype: 'toolbar',
        dock: 'top',
        items: [
            { xtype: 'button', text: 'Button 1' }
        ]
    }]

         * @markdown
         */
        if (me.tbar) {
            me.addDocked(initToolbar(me.tbar, 'top'));
            me.tbar = null;
        }

        /**
         * @cfg {Object/Array} bbar

Convenience method. Short for 'Bottom Bar'.

    bbar: [
      { xtype: 'button', text: 'Button 1' }
    ]

is equivalent to

    dockedItems: [{
        xtype: 'toolbar',
        dock: 'bottom',
        items: [
            { xtype: 'button', text: 'Button 1' }
        ]
    }]

         * @markdown
         */
        if (me.bbar) {
            me.addDocked(initToolbar(me.bbar, 'bottom'));
            me.bbar = null;
        }

        /**
         * @cfg {Object/Array} buttons

Convenience method used for adding buttons docked to the bottom right of the panel. This is a
synonym for the {@link #fbar} config.

    buttons: [
      { text: 'Button 1' }
    ]

is equivalent to

    dockedItems: [{
        xtype: 'toolbar',
        dock: 'bottom',
        defaults: {minWidth: {@link #minButtonWidth}},
        items: [
            { xtype: 'component', flex: 1 },
            { xtype: 'button', text: 'Button 1' }
        ]
    }]

The {@link #minButtonWidth} is used as the default {@link Ext.button.Button#minWidth minWidth} for
each of the buttons in the buttons toolbar.

         * @markdown
         */
        if (me.buttons) {
            me.fbar = me.buttons;
            me.buttons = null;
        }

        /**
         * @cfg {Object/Array} fbar

Convenience method used for adding items to the bottom right of the panel. Short for Footer Bar.

    fbar: [
      { type: 'button', text: 'Button 1' }
    ]

is equivalent to

    dockedItems: [{
        xtype: 'toolbar',
        dock: 'bottom',
        defaults: {minWidth: {@link #minButtonWidth}},
        items: [
            { xtype: 'component', flex: 1 },
            { xtype: 'button', text: 'Button 1' }
        ]
    }]

The {@link #minButtonWidth} is used as the default {@link Ext.button.Button#minWidth minWidth} for
each of the buttons in the fbar.

         * @markdown
         */
        if (me.fbar) {
            fbar = initToolbar(me.fbar, 'bottom');
            fbar.ui = 'footer';

            // Apply the minButtonWidth config to buttons in the toolbar
            if (minButtonWidth) {
                fbarDefaults = fbar.defaults;
                fbar.defaults = function(config) {
                    var defaults = fbarDefaults || {};
                    if ((!config.xtype || config.xtype === 'button' || (config.isComponent && config.isXType('button'))) &&
                            !('minWidth' in defaults)) {
                        defaults = Ext.apply({minWidth: minButtonWidth}, defaults);
                    }
                    return defaults;
                };
            }

            fbar = me.addDocked(fbar)[0];
            fbar.insert(0, {
                flex: 1,
                xtype: 'component',
                focusable: false
            });
            me.fbar = null;
        }

        /**
         * @cfg {Object/Array} lbar
         *
         * Convenience method. Short for 'Left Bar' (left-docked, vertical toolbar).
         *
         *    lbar: [
         *      { xtype: 'button', text: 'Button 1' }
         *    ]
         *
         * is equivalent to
         *
         *    dockedItems: [{
         *        xtype: 'toolbar',
         *        dock: 'left',
         *        items: [
         *            { xtype: 'button', text: 'Button 1' }
         *        ]
         *    }]
         *
         * @markdown
         */
        if (me.lbar) {
            me.addDocked(initToolbar(me.lbar, 'left'));
            me.lbar = null;
        }

        /**
         * @cfg {Object/Array} rbar
         *
         * Convenience method. Short for 'Right Bar' (right-docked, vertical toolbar).
         *
         *    rbar: [
         *      { xtype: 'button', text: 'Button 1' }
         *    ]
         *
         * is equivalent to
         *
         *    dockedItems: [{
         *        xtype: 'toolbar',
         *        dock: 'right',
         *        items: [
         *            { xtype: 'button', text: 'Button 1' }
         *        ]
         *    }]
         *
         * @markdown
         */
        if (me.rbar) {
            me.addDocked(initToolbar(me.rbar, 'right'));
            me.rbar = null;
        }
    },

    /**
     * @private
     * Tools are a Panel-specific capabilty.
     * Panel uses initTools. Subclasses may contribute tools by implementing addTools.
     */
    initTools: function() {
        var me = this;

        me.tools = me.tools || [];

        // Add a collapse tool unless configured to not show a collapse tool
        // or to not even show a header.
        if (me.collapsible && !(me.hideCollapseTool || me.header === false)) {
            me.collapseDirection = me.collapseDirection || me.headerPosition || 'top';
            me.collapseTool = me.expandTool = me.createComponent({
                xtype: 'tool',
                type: 'collapse-' + me.collapseDirection,
                expandType: me.getOppositeDirection(me.collapseDirection),
                handler: me.toggleCollapse,
                scope: me
            });

            // Prepend collapse tool is configured to do so.
            if (me.collapseFirst) {
                me.tools.unshift(me.collapseTool);
            }
        }

        // Add subclass-specific tools.
        me.addTools();

        // Make Panel closable.
        if (me.closable) {
            me.addClsWithUI('closable');
            me.addTool({
                type: 'close',
                handler: Ext.Function.bind(me.close, this, [])
            });
        }

        // Append collapse tool if needed.
        if (me.collapseTool && !me.collapseFirst) {
            me.tools.push(me.collapseTool);
        }
    },

    /**
     * @private
     * Template method to be implemented in subclasses to add their tools after the collapsible tool.
     */
    addTools: Ext.emptyFn,

    /**
     * <p>Closes the Panel. By default, this method, removes it from the DOM, {@link Ext.Component#destroy destroy}s
     * the Panel object and all its descendant Components. The {@link #beforeclose beforeclose}
     * event is fired before the close happens and will cancel the close action if it returns false.<p>
     * <p><b>Note:</b> This method is not affected by the {@link #closeAction} setting which
     * only affects the action triggered when clicking the {@link #closable 'close' tool in the header}.
     * To hide the Panel without destroying it, call {@link #hide}.</p>
     */
    close: function() {
        if (this.fireEvent('beforeclose', this) !== false) {
            this.doClose();
        }
    },

    // private
    doClose: function() {
        this.fireEvent('close', this);
        this[this.closeAction]();
    },

    onRender: function(ct, position) {
        var me = this,
            topContainer;

        // Add class-specific header tools.
        // Panel adds collapsible and closable.
        me.initTools();

        // Dock the header/title
        me.updateHeader();

        // If initially collapsed, collapsed flag must indicate true current state at this point.
        // Do collapse after the first time the Panel's structure has been laid out.
        if (me.collapsed) {
            me.collapsed = false;
            topContainer = me.findLayoutController();
            if (!me.hidden && topContainer) {
                topContainer.on({
                    afterlayout: function() {
                        me.collapse(null, false, true);
                    },
                    single: true
                });
            } else {
                me.afterComponentLayout = function() {
                    delete me.afterComponentLayout;
                    Ext.getClass(me).prototype.afterComponentLayout.apply(me, arguments);
                    me.collapse(null, false, true);
                };
            }
        }

        // Call to super after adding the header, to prevent an unnecessary re-layout
        me.callParent(arguments);
    },

    /**
     * Create, hide, or show the header component as appropriate based on the current config.
     * @private
     * @param {Boolean} force True to force the the header to be created
     */
    updateHeader: function(force) {
        var me = this,
            header = me.header,
            title = me.title,
            tools = me.tools;

        if (!me.preventHeader && (force || title || (tools && tools.length))) {
            if (!header) {
                header = me.header = Ext.create('Ext.panel.Header', {
                    title       : title,
                    orientation : (me.headerPosition == 'left' || me.headerPosition == 'right') ? 'vertical' : 'horizontal',
                    dock        : me.headerPosition || 'top',
                    textCls     : me.headerTextCls,
                    iconCls     : me.iconCls,
                    baseCls     : me.baseCls + '-header',
                    tools       : tools,
                    ui          : me.ui,
                    indicateDrag: me.draggable,
                    border      : me.border,
                    frame       : me.frame && me.frameHeader,
                    ignoreParentFrame : me.frame || me.overlapHeader,
                    ignoreBorderManagement: me.frame || me.ignoreHeaderBorderManagement,
                    listeners   : me.collapsible && me.titleCollapse ? {
                        click: me.toggleCollapse,
                        scope: me
                    } : null
                });
                me.addDocked(header, 0);

                // Reference the Header's tool array.
                // Header injects named references.
                me.tools = header.tools;
            }
            header.show();
            me.initHeaderAria();
        } else if (header) {
            header.hide();
        }
    },

    // inherit docs
    setUI: function(ui) {
        var me = this;

        me.callParent(arguments);

        if (me.header) {
            me.header.setUI(ui);
        }
    },

    // private
    getContentTarget: function() {
        return this.body;
    },

    getTargetEl: function() {
        return this.body || this.frameBody || this.el;
    },

    addTool: function(tool) {
        this.tools.push(tool);
        var header = this.header;
        if (header) {
            header.addTool(tool);
        }
        this.updateHeader();
    },

    getOppositeDirection: function(d) {
        var c = Ext.Component;
        switch (d) {
            case c.DIRECTION_TOP:
                return c.DIRECTION_BOTTOM;
            case c.DIRECTION_RIGHT:
                return c.DIRECTION_LEFT;
            case c.DIRECTION_BOTTOM:
                return c.DIRECTION_TOP;
            case c.DIRECTION_LEFT:
                return c.DIRECTION_RIGHT;
        }
    },

    /**
     * Collapses the panel body so that the body becomes hidden. Docked Components parallel to the
     * border towards which the collapse takes place will remain visible.  Fires the {@link #beforecollapse} event which will
     * cancel the collapse action if it returns false.
     * @param {Number} direction. The direction to collapse towards. Must be one of<ul>
     * <li>Ext.Component.DIRECTION_TOP</li>
     * <li>Ext.Component.DIRECTION_RIGHT</li>
     * <li>Ext.Component.DIRECTION_BOTTOM</li>
     * <li>Ext.Component.DIRECTION_LEFT</li></ul>
     * @param {Boolean} animate True to animate the transition, else false (defaults to the value of the
     * {@link #animCollapse} panel config)
     * @return {Ext.panel.Panel} this
     */
    collapse: function(direction, animate, /* private - passed if called at render time */ internal) {
        var me = this,
            c = Ext.Component,
            height = me.getHeight(),
            width = me.getWidth(),
            frameInfo,
            newSize = 0,
            dockedItems = me.dockedItems.items,
            dockedItemCount = dockedItems.length,
            i = 0,
            comp,
            pos,
            anim = {
                from: {
                    height: height,
                    width: width
                },
                to: {
                    height: height,
                    width: width
                },
                listeners: {
                    afteranimate: me.afterCollapse,
                    scope: me
                },
                duration: Ext.Number.from(animate, Ext.fx.Anim.prototype.duration)
            },
            reExpander,
            reExpanderOrientation,
            reExpanderDock,
            getDimension,
            setDimension,
            collapseDimension;

        if (!direction) {
            direction = me.collapseDirection;
        }

        // If internal (Called because of initial collapsed state), then no animation, and no events.
        if (internal) {
            animate = false;
        } else if (me.collapsed || me.fireEvent('beforecollapse', me, direction, animate) === false) {
            return false;
        }

        reExpanderDock = direction;
        me.expandDirection = me.getOppositeDirection(direction);

        // Track docked items which we hide during collapsed state
        me.hiddenDocked = [];

        switch (direction) {
            case c.DIRECTION_TOP:
            case c.DIRECTION_BOTTOM:
                me.expandedSize = me.getHeight();
                reExpanderOrientation = 'horizontal';
                collapseDimension = 'height';
                getDimension = 'getHeight';
                setDimension = 'setHeight';

                // Collect the height of the visible header.
                // Hide all docked items except the header.
                // Hide *ALL* docked items if we're going to end up hiding the whole Panel anyway
                for (; i < dockedItemCount; i++) {
                    comp = dockedItems[i];
                    if (comp.isVisible()) {
                        if (comp.isHeader && (!comp.dock || comp.dock == 'top' || comp.dock == 'bottom')) {
                            reExpander = comp;
                        } else {
                            me.hiddenDocked.push(comp);
                        }
                    }
                }

                if (direction == Ext.Component.DIRECTION_BOTTOM) {
                    pos = me.getPosition()[1] - Ext.fly(me.el.dom.offsetParent).getRegion().top;
                    anim.from.top = pos;
                }
                break;

            case c.DIRECTION_LEFT:
            case c.DIRECTION_RIGHT:
                me.expandedSize = me.getWidth();
                reExpanderOrientation = 'vertical';
                collapseDimension = 'width';
                getDimension = 'getWidth';
                setDimension = 'setWidth';

                // Collect the height of the visible header.
                // Hide all docked items except the header.
                // Hide *ALL* docked items if we're going to end up hiding the whole Panel anyway
                for (; i < dockedItemCount; i++) {
                    comp = dockedItems[i];
                    if (comp.isVisible()) {
                        if (comp.isHeader && (comp.dock == 'left' || comp.dock == 'right')) {
                            reExpander = comp;
                        } else {
                            me.hiddenDocked.push(comp);
                        }
                    }
                }

                if (direction == Ext.Component.DIRECTION_RIGHT) {
                    pos = me.getPosition()[0] - Ext.fly(me.el.dom.offsetParent).getRegion().left;
                    anim.from.left = pos;
                }
                break;

            default:
                throw('Panel collapse must be passed a valid Component collapse direction');
        }

        // No scrollbars when we shrink this Panel
        // And no laying out of any children... we're effectively *hiding* the body
        me.setAutoScroll(false);
        me.suspendLayout = true;
        me.body.setVisibilityMode(Ext.core.Element.DISPLAY);

        // Disable toggle tool during animated collapse
        if (animate && me.collapseTool) {
            me.collapseTool.disable();
        }

        // Add the collapsed class now, so that collapsed CSS rules are applied before measurements are taken.
        me.addClsWithUI(me.collapsedCls);
        // if (me.border === false) {
        //     me.addClsWithUI(me.collapsedCls + '-noborder');
        // }

        // We found a header: Measure it to find the collapse-to size.
        if (reExpander) {
            //we must add the collapsed cls to the header and then remove to get the proper height
            reExpander.addClsWithUI(me.collapsedCls);
            reExpander.addClsWithUI(me.collapsedCls + '-' + reExpander.dock);
            if (me.border && (!me.frame || (me.frame && Ext.supports.CSS3BorderRadius))) {
                reExpander.addClsWithUI(me.collapsedCls + '-border-' + reExpander.dock);
            }

            frameInfo = reExpander.getFrameInfo();
                        
            //get the size
            newSize = reExpander[getDimension]() + (frameInfo ? frameInfo[direction] : 0);

            //and remove
            reExpander.removeClsWithUI(me.collapsedCls);
            reExpander.removeClsWithUI(me.collapsedCls + '-' + reExpander.dock);              
            if (me.border && (!me.frame || (me.frame && Ext.supports.CSS3BorderRadius))) {
                reExpander.removeClsWithUI(me.collapsedCls + '-border-' + reExpander.dock);
            }
        }
        // No header: Render and insert a temporary one, and then measure it.
        else {
            reExpander = {
                hideMode: 'offsets',
                temporary: true,
                title: me.title,
                orientation: reExpanderOrientation,
                dock: reExpanderDock,
                textCls: me.headerTextCls,
                iconCls: me.iconCls,
                baseCls: me.baseCls + '-header',
                ui: me.ui,
                frame: me.frame && me.frameHeader,
                ignoreParentFrame: me.frame || me.overlapHeader,
                indicateDrag: me.draggable,
                cls: me.baseCls + '-collapsed-placeholder ' + ' ' + Ext.baseCSSPrefix + 'docked ' + me.baseCls + '-' + me.ui + '-collapsed',
                renderTo: me.el
            };
            if (!me.hideCollapseTool) {
                reExpander[(reExpander.orientation == 'horizontal') ? 'tools' : 'items'] = [{
                    xtype: 'tool',
                    type: 'expand-' + me.expandDirection,
                    handler: me.toggleCollapse,
                    scope: me
                }];
            }

            // Capture the size of the re-expander.
            // For vertical headers in IE6 and IE7, this will be sized by a CSS rule in _panel.scss
            reExpander = me.reExpander = Ext.create('Ext.panel.Header', reExpander);
            newSize = reExpander[getDimension]() + ((reExpander.frame) ? reExpander.frameSize[direction] : 0);
            reExpander.hide();

            // Insert the new docked item
            me.insertDocked(0, reExpander);
        }

        me.reExpander = reExpander;
        me.reExpander.addClsWithUI(me.collapsedCls);
        me.reExpander.addClsWithUI(me.collapsedCls + '-' + reExpander.dock);
        if (me.border && (!me.frame || (me.frame && Ext.supports.CSS3BorderRadius))) {
            me.reExpander.addClsWithUI(me.collapsedCls + '-border-' + me.reExpander.dock);
        }

        // If collapsing right or down, we'll be also animating the left or top.
        if (direction == Ext.Component.DIRECTION_RIGHT) {
            anim.to.left = pos + (width - newSize);
        } else if (direction == Ext.Component.DIRECTION_BOTTOM) {
            anim.to.top = pos + (height - newSize);
        }

        // Animate to the new size
        anim.to[collapseDimension] = newSize;

        // Remove any flex config before we attempt to collapse.
        me.savedFlex = me.flex;
        me.savedMinWidth = me.minWidth;
        me.savedMinHeight = me.minHeight;
        me.minWidth = 0;
        me.minHeight = 0;
        delete me.flex;

        if (animate) {
            me.animate(anim);
        } else {
            // EXTJSIV-1937 (would like to use setCalculateSize)
            // save width/height here, expand puts them back
            me.uncollapsedSize = { width: me.width, height: me.height };

            me.setSize(anim.to.width, anim.to.height);
            if (Ext.isDefined(anim.to.left) || Ext.isDefined(anim.to.top)) {
                me.setPosition(anim.to.left, anim.to.top);
            }
            me.afterCollapse(false, internal);
        }
        return me;
    },

    afterCollapse: function(animated, internal) {
        var me = this,
            i = 0,
            l = me.hiddenDocked.length;

        me.minWidth = me.savedMinWidth;
        me.minHeight = me.savedMinHeight;

        me.body.hide();
        for (; i < l; i++) {
            me.hiddenDocked[i].hide();
        }
        if (me.reExpander) {
            me.reExpander.updateFrame();
            me.reExpander.show();
        }
        me.collapsed = true;

        if (!internal) {
            me.doComponentLayout();
        }

        if (me.resizer) {
            me.resizer.disable();
        }

        // If me Panel was configured with a collapse tool in its header, flip it's type
        if (me.collapseTool) {
            me.collapseTool.setType('expand-' + me.expandDirection);
        }
        if (!internal) {
            me.fireEvent('collapse', me);
        }

        // Re-enable the toggle tool after an animated collapse
        if (animated && me.collapseTool) {
            me.collapseTool.enable();
        }
    },

    /**
     * Expands the panel body so that it becomes visible.  Fires the {@link #beforeexpand} event which will
     * cancel the expand action if it returns false.
     * @param {Boolean} animate True to animate the transition, else false (defaults to the value of the
     * {@link #animCollapse} panel config)
     * @return {Ext.panel.Panel} this
     */
    expand: function(animate) {
        if (!this.collapsed || this.fireEvent('beforeexpand', this, animate) === false) {
            return false;
        }

        // EXTJSIV-1937 (would like to use setCalculateSize)
        if (this.uncollapsedSize) {
            Ext.Object.each(this.uncollapsedSize, function (name, value) {
                if (Ext.isDefined(value)) {
                    this[name] = value;
                } else {
                    delete this[name];
                }
            }, this);
            delete this.uncollapsedSize;
        }

        var me = this,
            i = 0,
            l = me.hiddenDocked.length,
            direction = me.expandDirection,
            height = me.getHeight(),
            width = me.getWidth(),
            pos, anim, satisfyJSLint;

        // Disable toggle tool during animated expand
        if (animate && me.collapseTool) {
            me.collapseTool.disable();
        }

        // Show any docked items that we hid on collapse
        // And hide the injected reExpander Header
        for (; i < l; i++) {
            me.hiddenDocked[i].hidden = false;
            me.hiddenDocked[i].el.show();
        }
        if (me.reExpander) {
            if (me.reExpander.temporary) {
                me.reExpander.hide();
            } else {
                me.reExpander.removeClsWithUI(me.collapsedCls);
                me.reExpander.removeClsWithUI(me.collapsedCls + '-' + me.reExpander.dock);
                if (me.border && (!me.frame || (me.frame && Ext.supports.CSS3BorderRadius))) {
                    me.reExpander.removeClsWithUI(me.collapsedCls + '-border-' + me.reExpander.dock);
                }
                me.reExpander.updateFrame();
            }
        }

        // If me Panel was configured with a collapse tool in its header, flip it's type
        if (me.collapseTool) {
            me.collapseTool.setType('collapse-' + me.collapseDirection);
        }

        // Unset the flag before the potential call to calculateChildBox to calculate our newly flexed size
        me.collapsed = false;

        // Collapsed means body element was hidden
        me.body.show();

        // Remove any collapsed styling before any animation begins
        me.removeClsWithUI(me.collapsedCls);
        // if (me.border === false) {
        //     me.removeClsWithUI(me.collapsedCls + '-noborder');
        // }

        anim = {
            to: {
            },
            from: {
                height: height,
                width: width
            },
            listeners: {
                afteranimate: me.afterExpand,
                scope: me
            }
        };

        if ((direction == Ext.Component.DIRECTION_TOP) || (direction == Ext.Component.DIRECTION_BOTTOM)) {

            // If autoHeight, measure the height now we have shown the body element.
            if (me.autoHeight) {
                me.setCalculatedSize(me.width, null);
                anim.to.height = me.getHeight();

                // Must size back down to collapsed for the animation.
                me.setCalculatedSize(me.width, anim.from.height);
            }
            // If we were flexed, then we can't just restore to the saved size.
            // We must restore to the currently correct, flexed size, so we much ask the Box layout what that is.
            else if (me.savedFlex) {
                me.flex = me.savedFlex;
                anim.to.height = me.ownerCt.layout.calculateChildBox(me).height;
                delete me.flex;
            }
            // Else, restore to saved height
            else {
                anim.to.height = me.expandedSize;
            }

            // top needs animating upwards
            if (direction == Ext.Component.DIRECTION_TOP) {
                pos = me.getPosition()[1] - Ext.fly(me.el.dom.offsetParent).getRegion().top;
                anim.from.top = pos;
                anim.to.top = pos - (anim.to.height - height);
            }
        } else if ((direction == Ext.Component.DIRECTION_LEFT) || (direction == Ext.Component.DIRECTION_RIGHT)) {

            // If autoWidth, measure the width now we have shown the body element.
            if (me.autoWidth) {
                me.setCalculatedSize(null, me.height);
                anim.to.width = me.getWidth();

                // Must size back down to collapsed for the animation.
                me.setCalculatedSize(anim.from.width, me.height);
            }
            // If we were flexed, then we can't just restore to the saved size.
            // We must restore to the currently correct, flexed size, so we much ask the Box layout what that is.
            else if (me.savedFlex) {
                me.flex = me.savedFlex;
                anim.to.width = me.ownerCt.layout.calculateChildBox(me).width;
                delete me.flex;
            }
            // Else, restore to saved width
            else {
                anim.to.width = me.expandedSize;
            }

            // left needs animating leftwards
            if (direction == Ext.Component.DIRECTION_LEFT) {
                pos = me.getPosition()[0] - Ext.fly(me.el.dom.offsetParent).getRegion().left;
                anim.from.left = pos;
                anim.to.left = pos - (anim.to.width - width);
            }
        }

        if (animate) {
            me.animate(anim);
        } else {
            me.setSize(anim.to.width, anim.to.height);
            if (anim.to.x) {
                me.setLeft(anim.to.x);
            }
            if (anim.to.y) {
                me.setTop(anim.to.y);
            }
            me.afterExpand(false);
        }

        return me;
    },

    afterExpand: function(animated) {
        var me = this;
        me.setAutoScroll(me.initialConfig.autoScroll);

        // Restored to a calculated flex. Delete the set width and height properties so that flex works from now on.
        if (me.savedFlex) {
            me.flex = me.savedFlex;
            delete me.savedFlex;
            delete me.width;
            delete me.height;
        }

        // Reinstate layout out after Panel has re-expanded
        delete me.suspendLayout;
        if (animated && me.ownerCt) {
            me.ownerCt.doLayout();
        }

        if (me.resizer) {
            me.resizer.enable();
        }

        me.fireEvent('expand', me);

        // Re-enable the toggle tool after an animated expand
        if (animated && me.collapseTool) {
            me.collapseTool.enable();
        }
    },

    /**
     * Shortcut for performing an {@link #expand} or {@link #collapse} based on the current state of the panel.
     * @return {Ext.panel.Panel} this
     */
    toggleCollapse: function() {
        if (this.collapsed) {
            this.expand(this.animCollapse);
        } else {
            this.collapse(this.collapseDirection, this.animCollapse);
        }
        return this;
    },

    // private
    getKeyMap : function(){
        if(!this.keyMap){
            this.keyMap = Ext.create('Ext.util.KeyMap', this.el, this.keys);
        }
        return this.keyMap;
    },

    // private
    initDraggable : function(){
        /**
         * <p>If this Panel is configured {@link #draggable}, this property will contain
         * an instance of {@link Ext.dd.DragSource} which handles dragging the Panel.</p>
         * The developer must provide implementations of the abstract methods of {@link Ext.dd.DragSource}
         * in order to supply behaviour for each stage of the drag/drop process. See {@link #draggable}.
         * @type Ext.dd.DragSource.
         * @property dd
         */
        this.dd = Ext.create('Ext.panel.DD', this, Ext.isBoolean(this.draggable) ? null : this.draggable);
    },

    // private - helper function for ghost
    ghostTools : function() {
        var tools = [],
            origTools = this.initialConfig.tools;

        if (origTools) {
            Ext.each(origTools, function(tool) {
                // Some tools can be full components, and copying them into the ghost
                // actually removes them from the owning panel. You could also potentially
                // end up with duplicate DOM ids as well. To avoid any issues we just make
                // a simple bare-minimum clone of each tool for ghosting purposes.
                tools.push({
                    type: tool.type
                });
            });
        }
        else {
            tools = [{
                type: 'placeholder'
            }];
        }
        return tools;
    },

    // private - used for dragging
    ghost: function(cls) {
        var me = this,
            ghostPanel = me.ghostPanel,
            box = me.getBox();

        if (!ghostPanel) {
            ghostPanel = Ext.create('Ext.panel.Panel', {
                renderTo: document.body,
                floating: {
                    shadow: false
                },
                frame: Ext.supports.CSS3BorderRadius ? me.frame : false,
                title: me.title,
                overlapHeader: me.overlapHeader,
                headerPosition: me.headerPosition,
                width: me.getWidth(),
                height: me.getHeight(),
                iconCls: me.iconCls,
                baseCls: me.baseCls,
                tools: me.ghostTools(),
                cls: me.baseCls + '-ghost ' + (cls ||'')
            });
            me.ghostPanel = ghostPanel;
        }
        ghostPanel.floatParent = me.floatParent;
        if (me.floating) {
            ghostPanel.setZIndex(Ext.Number.from(me.el.getStyle('zIndex'), 0));
        } else {
            ghostPanel.toFront();
        }
        ghostPanel.el.show();
        ghostPanel.setPosition(box.x, box.y);
        ghostPanel.setSize(box.width, box.height);
        me.el.hide();
        if (me.floatingItems) {
            me.floatingItems.hide();
        }
        return ghostPanel;
    },

    // private
    unghost: function(show, matchPosition) {
        var me = this;
        if (!me.ghostPanel) {
            return;
        }
        if (show !== false) {
            me.el.show();
            if (matchPosition !== false) {
                me.setPosition(me.ghostPanel.getPosition());
            }
            if (me.floatingItems) {
                me.floatingItems.show();
            }
            Ext.defer(me.focus, 10, me);
        }
        me.ghostPanel.el.hide();
    },

    initResizable: function(resizable) {
        if (this.collapsed) {
            resizable.disabled = true;
        }
        this.callParent([resizable]);
    }
});
