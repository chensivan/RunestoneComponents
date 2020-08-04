/**
 *
 * Created by bmiller on 3/19/15.
 */
"use strict";

import RunestoneBase from "../../common/js/runestonebase.js";
import AudioTour from "./audiotour";
import "./activecode-i18n.en";
import CodeMirror from "codemirror";
import "codemirror/mode/python/python.js";
import "codemirror/mode/css/css.js";
import "codemirror/mode/htmlmixed/htmlmixed.js";
import "codemirror/mode/xml/xml.js";
import "codemirror/mode/javascript/javascript.js";
import "codemirror/mode/sql/sql.js";
import "codemirror/mode/clike/clike.js";
import "./activecode-i18n.en.js";
import "./../css/activecode.css";
import "codemirror/lib/codemirror.css";

// Get the current webpage's url
var currentUrl = window.location.href;
var currentHash = window.location.hash;
if (currentHash != ""){currentUrl = currentUrl.split("#")[0];}

function buildGlobalMenu() {
    // Add the global menu to each page
    let rightNav = $('.navbar-right');
    var menu = document.createElement('li');
    menu.title = "Show Discussion";
    menu.onclick = function () {                 
        changeNav();
    };

    // Add menu button in the top toolbar
    var menuInnerA = document.createElement('a');
    menuInnerA.href = "#";
    menuInnerA.id = "globalMenu";
    var globalMenu = document.createElement('i');
    $(globalMenu).addClass("glyphicon glyphicon-th-list");
    $(globalMenu).css("opacity", "0.9");
    menuInnerA.appendChild(globalMenu);
    // Add the discussion count in the button
    var menuInnerB = document.createElement('a');
    menuInnerB.id = "globalCount";
    menuInnerB.innerHTML = "0";
    menuInnerB.setAttribute(
        "style",
        "height: 16px; min-width: 16px; border-radius: 16px; line-height: 16px; \
         padding: 0 2px; font-size: 12px; font-weight: bold; text-align: center; \
         position: absolute; top: 3px; right: 2px; background-color: red; \
         color: white; display: none;"
    );
    menu.appendChild(menuInnerA);
    menu.appendChild(menuInnerB);
    // Add the element to the html file
    rightNav.prepend(menu);

    // Create the sidebar to display the discussion items
    var sideBar = document.createElement('div');
    sideBar.id = "sideBar";
    sideBar.setAttribute(
        "style",
        "height: 100%; width: 0; position: fixed; z-index: 1; \
         top: 0; left: 0; background-color: #eeeeee; overflow-x: hidden; \
         transition: 0.5s;"
    );
    var topInfo = document.createElement('div');
    topInfo.id = "topInfo";
    topInfo.setAttribute(
        "style",
        "background: #fff; height: 40px; z-index: 9999; \
         top: 0px; border-bottom: 2px solid #dbdbdb; font-size: 23px;"
    );
    topInfo.innerHTML = "&nbsp;<span class='glyphicon glyphicon-info-sign' aria-hidden='true'></span>  &nbsp; Discussion List";
    sideBar.appendChild(topInfo);

    // Create the separate bar of the background
    var backBar = document.createElement('div');
    backBar.id = "backBar";
    backBar.setAttribute(
        "style",
        "background: rgba(0,0,0,.08); position: fixed; height: 100%; \
         width: 22px; left: 0; transition: 0.5s; pointer-events: none;"
    );

    // Create the side button to open and close the sidebar
    var closeButton = document.createElement('button');
    closeButton.id = "closeButton";
    closeButton.title = "Show Discussion";
    $(closeButton).addClass("glyphicon glyphicon-chevron-right");
    closeButton.setAttribute(
        "style",
        "position: absolute; z-index: 1; left: 0px; top: 0; transition: 0.5s; \
         width: 36px; height: 40px; border: solid 2px #dbdbdb; outline: none;\
         background: #fff; color: #9c9c9c; border-style: none solid solid none;"
    );
    closeButton.onclick = function () {
        changeNav();
    };
    rightNav.prepend(sideBar);
    rightNav.prepend(backBar);
    rightNav.prepend(closeButton);

    // Create the bottom-right pop window    
    var popWindow = document.createElement('div');
    popWindow.id = "popWindow";
    var closeWindow = document.createElement('a');
    closeWindow.href = "javascript:void(0)";
    $(closeWindow).addClass("glyphicon glyphicon-remove");
    $(closeWindow).css("font-size", "25px");
    $(closeWindow).css("color", "black");
    closeWindow.onclick = function () {
        document.getElementById("popWindow").style.display = "None";
    };
    popWindow.appendChild(closeWindow);
    popWindow.setAttribute(
        "style",
        "position: fixed; z-index: 10; right: 20px; bottom: 20px; \
         display: none; border-style: solid solid solid solid; \
         border: solid 2px black; background-color: white;"
    );
    rightNav.prepend(popWindow);
}

function changeNav() {
    var target = document.getElementById("sideBar");
    if (target.style.width == "0px"){
        // the sidebar is closed, button to open the sidebar
        target.style.width = "300px";
        document.getElementById("closeButton").style.left = "300px";
        document.getElementById("closeButton").className = "glyphicon glyphicon-chevron-left";
        document.getElementById("backBar").style.left = "300px";

        // once open the menu, the globalMenu button will disappear style
        document.getElementById("globalCount").style.display = "none";
        document.getElementById("globalCount").innerHTML = "0";
        document.getElementById("globalMenu").style.color = "";
    } else {
        // the sidebar is open, button to close the sidebar
        target.style.width = "0px";
        document.getElementById("closeButton").style.left = "0px";
        document.getElementById("closeButton").className = "glyphicon glyphicon-chevron-right";
        document.getElementById("backBar").style.left = "0px";
    }
}

$(document).bind("runestone:login-complete",buildGlobalMenu);

class ShareDBCodeMirrorBinding {
    constructor(codeMirror, doc) {
        this.suppressChanges = false;
        this.initialFetchCallbacks = [];
        this.gotInitialFetch = false;
        this.doc = doc;
        this.editorDoc = codeMirror.getDoc();
        this.codeMirror = codeMirror;

        this.$onSDBDocEvent = this.onSDBDocEvent.bind(this);
        this.$updateDoc = this.updateDoc.bind(this);
        this.$onCodeMirrorChange = this.onCodeMirrorChange.bind(this);

        this.doc.on("op", this.$updateDoc);
        this.doc.subscribe(this.$onSDBDocEvent);
        this.codeMirror.on("change", this.$onCodeMirrorChange);
    }

    updateDoc(ops, source) {
        this.suppressChanges = true;
        if (!source) {
            ops.forEach((op) => this.applyOp(op));
        }
        this.suppressChanges = false;
    }

    destroy() {
        this.doc.unsubscribe(this.$onSDBDocEvent);
        this.codeMirror.off("change", this.$onCodeMirrorChange);
        this.doc.removeListener("op", this.$updateDoc);
    }

    onSDBDocEvent(type, ops, source) {
        this.suppressChanges = true;
        if (!type) {
            const data = this.doc.data.code;
            this.codeMirror.setValue(data);
            this.gotInitialFetch = true;
            this.initialFetchCallbacks.forEach((callback) => callback());
            this.initialFetchCallbacks.splice(0, this.initialFetchCallbacks.length);
        } else if (type === "op") {
            if (source !== this) {
                ops.forEach((op) => this.applyOp(op));
            }
        }

        this.suppressChanges = false;
    }

    onCodeMirrorChange(codeMirror, change) {
        if (!this.suppressChanges) {
            const ops = this.createOpFromChange(change);
            this.doc.submitOp(ops, this);
        }
    }

    onInitialFetch(callback) {
        if (this.gotInitialFetch) {
            callback();
        } else {
            this.initialFetchCallbacks.push(callback);
        }
    }

    assertValue() {
        const editorValue = this.codeMirror.getValue();
        const expectedValue = this.doc.getData();
        if (editorValue !== expectedValue) {
            console.error(
                `Expected value (${expectedValue}) did not match editor value (${editorValue})`
            );
            this.codeMirror.setValue(expectedValue);
        }
    }

    applyOp(op) {
        const editorDoc = this.editorDoc;
        const { si, sd, p } = op;
        const index = p[1];

        if (si) {
            editorDoc.replaceRange(si, editorDoc.posFromIndex(index));
        } else if (sd) {
            const from = editorDoc.posFromIndex(index);
            const to = editorDoc.posFromIndex(index + sd.length);
            editorDoc.replaceRange("", from, to);
        }
        this.assertValue.bind(this);
    }

    createOpFromChange(change) {
        const op = [];
        let textIndex = 0;
        const startLine = change.from.line;

        for (let i = 0; i < startLine; i++) {
            textIndex += this.codeMirror.lineInfo(i).text.length + 1;
        }

        textIndex += change.from.ch;

        if (change.to.line !== change.from.line || change.to.ch !== change.from.ch) {
            const removed = change.removed.join("\n");
            op.push({ p: ["code", textIndex], sd: removed });
        }

        if (change.text) {
            const text = change.text.join("\n");
            if (text) {
                op.push({ p: ["code", textIndex], si: text });
            }
        }
        return op;
    }
}

var isMouseDown = false;
document.onmousedown = function () {
    isMouseDown = true;
};

document.onmouseup = function () {
    isMouseDown = false;
};
window.edList = {};

var socket, connection, doc;
var chatcodesServer = "chat.codes";


var newUser = "User" + Math.floor(Math.random() * 100);
var socket_mini, connection_mini;
var socket_codecontent, connection_codecontent;


// separate into constructor and init
export class ActiveCode extends RunestoneBase {
    constructor(opts) {
        super(opts);
        //RunestoneBase.prototype.init.apply(this, arguments);
        var suffStart;
        var orig = opts.orig;
        this.useRunestoneServices = opts.useRunestoneServices;
        this.python3 = opts.python3;
        this.alignVertical = opts.vertical;
        this.origElem = orig;
        this.divid = orig.id;
        this.code = $(orig).text() || "\n\n\n\n\n";
        this.language = $(orig).data("lang");
        this.timelimit = $(orig).data("timelimit");
        this.includes = $(orig).data("include");
        this.hidecode = $(orig).data("hidecode");
        this.chatcodes = $(orig).data("chatcodes");
        this.hidehistory = $(orig).data("hidehistory");
        this.tie = $(orig).data("tie");
        this.dburl = $(orig).data("dburl");
        this.runButton = null;
        this.enabledownload = $(orig).data("enabledownload");
        this.downloadButton = null;
        this.saveButton = null;
        this.loadButton = null;
        this.outerDiv = null;
        this.partner = "";
        if (!eBookConfig.allow_pairs || $(orig).data("nopair")) {
            this.enablePartner = false;
        } else {
            this.enablePartner = true;
        }
        this.output = null; // create pre for output
        this.graphics = null; // create div for turtle graphics
        this.codecoach = null;
        this.codelens = null;
        this.controlDiv = null;
        this.historyScrubber = null;
        this.timestamps = ["Original"];
        this.autorun = $(orig).data("autorun");
        if (this.chatcodes && eBookConfig.enable_chatcodes) {
            if (!socket) {
                socket = new WebSocket("wss://" + chatcodesServer);
            }
            if (!connection) {
                connection = new window.sharedb.Connection(socket);
            }
            if (!doc) {
                doc = connection.get("chatcodes", "channels");
            }
        }

        // for usernames
        if (!socket_mini) {
            socket_mini = new WebSocket("ws://localhost:3000");
        }
        if (!connection_mini) {
            connection_mini = new sharedb.Connection(socket_mini);
        }

        // for code content
        if (!socket_codecontent) {
            socket_codecontent = new WebSocket("ws://localhost:3000");
        }
        if (!connection_codecontent) {
            connection_codecontent = new sharedb.Connection(socket_codecontent);
        }

        if (this.graderactive) {
            this.hidecode = false;
        }
        if (this.includes !== undefined) {
            this.includes = this.includes.split(/\s+/);
        }
        suffStart = this.code.indexOf("====");
        if (suffStart > -1) {
            this.suffix = this.code.substring(suffStart + 5);
            this.code = this.code.substring(0, suffStart);
        }
        this.history = [this.code];
        this.createEditor();
        this.createOutput();
        this.createControls();
        if ($(orig).data("caption")) {
            this.caption = $(orig).data("caption");
        } else {
            this.caption = "ActiveCode";
        }
        this.addCaption("runestone");
        if (this.autorun) {
            $(document).ready(this.runProg.bind(this));
        }
    }

    createEditor(index) {
        this.containerDiv = document.createElement("div");
        this.containerDiv.setAttribute("href", "#" + this.divid);
        var linkdiv = document.createElement("div");
        linkdiv.id = this.divid.replace(/_/g, "-").toLowerCase(); // :ref: changes _ to - so add this as a target
        $(this.containerDiv).addClass("ac_section alert alert-warning");
        // code window
        var codeDiv = document.createElement("div");
        $(codeDiv).addClass("ac_code_div col-md-12");
        codeDiv.id = "code" + this.divid;
        // discussion window
        var discussionDiv = document.createElement("div");
        discussionDiv.id = "discussionDiv" + this.divid;
        $(discussionDiv).addClass("col-md-12");
        $(discussionDiv).css("display", "none");
        $(discussionDiv).css("height", "420px");
        $(discussionDiv).css("overflow", "auto");

        // var diffDiv = document.createElement("div");
        // diffDiv.id = "diffDiv" + this.divid;
        // $(diffDiv).addClass("col-md-12");
        // $(diffDiv).css("display", "none");
        // $(diffDiv).css("padding-bottom", "15px");
        // var diffInnerDiv = document.createElement("div");
        // diffInnerDiv.id = "diffInnerDiv" + this.divid;
        // $(diffInnerDiv).addClass("col-md-12");
        // $(diffInnerDiv).css("background", "#ffffff");
        // $(diffInnerDiv).css("border", "solid 2px #dbdbdb");
        // $(diffInnerDiv).css("max-height", "300px");
        // $(diffInnerDiv).css("overflow", "auto");
        // diffDiv.appendChild(diffInnerDiv);

        // this.diffDiv = diffDiv;
        // this.diffInnerDiv = diffInnerDiv;
        this.codeDiv = codeDiv;
        this.discussionDiv = discussionDiv;
        this.containerDiv.id = this.divid;
        this.containerDiv.lang = this.language;
        this.outerDiv = this.containerDiv;

        $(this.origElem).replaceWith(this.containerDiv);
        if (linkdiv.id !== this.divid) {
            // Don't want the 'extra' target if they match.
            this.containerDiv.appendChild(linkdiv);
        }
        this.containerDiv.appendChild(codeDiv);
        // this.containerDiv.appendChild(diffDiv);
        this.containerDiv.appendChild(discussionDiv);
        var edmode = this.containerDiv.lang;
        if (edmode === "sql") {
            edmode = "text/x-sql";
        } else if (edmode === "java") {
            edmode = "text/x-java";
        } else if (edmode === "cpp") {
            edmode = "text/x-c++src";
        }
        var editor = CodeMirror(codeDiv, {
            value: this.code,
            lineNumbers: true,
            mode: edmode,
            indentUnit: 4,
            matchBrackets: true,
            autoMatchParens: true,
            extraKeys: {
                Tab: "indentMore",
                "Shift-Tab": "indentLess",
            },
        });
        // Make the editor resizable
        $(editor.getWrapperElement()).resizable({
            resize: function () {
                editor.setSize($(this).width(), $(this).height());
                editor.refresh();
            },
        });
        // give the user a visual cue that they have changed but not saved
        editor.on(
            "change",
            function (ev) {
                if (
                    editor.acEditEvent == false ||
                    editor.acEditEvent === undefined
                ) {
                    // change events can come before any real changes for various reasons, some unknown
                    // this avoids unneccsary log events and updates to the activity counter
                    if (this.origElem.textContent === editor.getValue()) {
                        return;
                    }
                    $(editor.getWrapperElement()).css(
                        "border-top",
                        "2px solid #b43232"
                    );
                    $(editor.getWrapperElement()).css(
                        "border-bottom",
                        "2px solid #b43232"
                    );
                    this.logBookEvent({
                        event: "activecode",
                        act: "edit",
                        div_id: this.divid,
                    });
                }
                editor.acEditEvent = true;
            }.bind(this)
        ); // use bind to preserve *this* inside the on handler.
        //Solving Keyboard Trap of ActiveCode: If user use tab for navigation outside of ActiveCode, then change tab behavior in ActiveCode to enable tab user to tab out of the textarea
        $(window).keydown(function (e) {
            var code = e.keyCode ? e.keyCode : e.which;
            if (code == 9 && $("textarea:focus").length === 0) {
                editor.setOption("extraKeys", {
                    Tab: function (cm) {
                        $(document.activeElement)
                            .closest(".tab-content")
                            .nextSibling.focus();
                    },
                    "Shift-Tab": function (cm) {
                        $(document.activeElement)
                            .closest(".tab-content")
                            .previousSibling.focus();
                    },
                });
            }
        });
        this.editor = editor;
        if (this.hidecode) {
            $(this.codeDiv).css("display", "none");
        }
    }
    createControls() {
        var edmode = this.containerDiv.lang;
        var ctrlDiv = document.createElement("div");
        var butt;
        $(ctrlDiv).addClass("ac_actions");
        $(ctrlDiv).addClass("col-md-12");
        // Run
        butt = document.createElement("button");
        $(butt).text($.i18n("msg_activecode_run_code"));
        $(butt).addClass("btn btn-success run-button");
        ctrlDiv.appendChild(butt);
        this.runButton = butt;
        $(butt).click(this.runProg.bind(this));
        $(butt).attr("type", "button");
        if (this.enabledownload || eBookConfig.downloadsEnabled) {
            butt = document.createElement("button");
            $(butt).text("Download");
            $(butt).addClass("btn save-button");
            ctrlDiv.appendChild(butt);
            this.downloadButton = butt;
            $(butt).click(this.downloadFile.bind(this, this.language));
            $(butt).attr("type", "button");
        }
        if (!this.hidecode && !this.hidehistory) {
            butt = document.createElement("button");
            $(butt).text($.i18n("msg_activecode_load_history"));
            $(butt).addClass("btn btn-default");
            $(butt).attr("type", "button");
            ctrlDiv.appendChild(butt);
            this.histButton = butt;
            $(butt).click(this.addHistoryScrubber.bind(this));
            if (this.graderactive) {
                this.addHistoryScrubber(true);
            }
        }
        if ($(this.origElem).data("gradebutton") && !this.graderactive) {
            butt = document.createElement("button");
            $(butt).addClass("ac_opt btn btn-default");
            $(butt).text($.i18n("msg_activecode_show_feedback"));
            $(butt).css("margin-left", "10px");
            $(butt).attr("type", "button");
            this.gradeButton = butt;
            ctrlDiv.appendChild(butt);
            $(butt).click(this.createGradeSummary.bind(this));
        }
        // Show/Hide Code
        if (this.hidecode) {
            $(this.runButton).attr("disabled", "disabled");
            butt = document.createElement("button");
            $(butt).addClass("ac_opt btn btn-default");
            $(butt).text($.i18n("msg_activecode_show_code"));
            $(butt).css("margin-left", "10px");
            $(butt).attr("type", "button");
            this.showHideButt = butt;
            ctrlDiv.appendChild(butt);
            $(butt).click(
                function () {
                    $(this.codeDiv).toggle();
                    if (this.historyScrubber == null) {
                        this.addHistoryScrubber(true);
                    } else {
                        $(this.historyScrubber.parentElement).toggle();
                    }
                    if (
                        $(this.showHideButt).text() ==
                        $.i18n("msg_activecode_show_code")
                    ) {
                        $(this.showHideButt).text(
                            $.i18n("msg_activecode_hide_code")
                        );
                    } else {
                        $(this.showHideButt).text(
                            $.i18n("msg_activecode_show_code")
                        );
                    }
                    if ($(this.runButton).attr("disabled")) {
                        $(this.runButton).removeAttr("disabled");
                    } else {
                        $(this.runButton).attr("disabled", "disabled");
                    }
                }.bind(this)
            );
        }
        // CodeLens
        if ($(this.origElem).data("codelens") && !this.graderactive) {
            butt = document.createElement("button");
            $(butt).addClass("ac_opt btn btn-default");
            $(butt).text($.i18n("msg_activecode_show_codelens"));
            $(butt).css("margin-left", "10px");
            this.clButton = butt;
            ctrlDiv.appendChild(butt);
            $(butt).click(this.showCodelens.bind(this));
        }
        // TIE
        if (this.tie) {
            butt = document.createElement("button");
            $(butt).addClass("ac_opt btn btn-default");
            $(butt).text("Open Code Coach");
            this.tieButt = butt;
            ctrlDiv.appendChild(butt);
            $(butt).click(this.showTIE.bind(this));
        }
        // CodeCoach
        // bnm - disable code coach until it is revamped  2017-7-22
        // if (this.useRunestoneServices && $(this.origElem).data("coach")) {
        //     butt = document.createElement("button");
        //     $(butt).addClass("ac_opt btn btn-default");
        //     $(butt).text("Code Coach");
        //     $(butt).css("margin-left", "10px");
        //     this.coachButton = butt;
        //     ctrlDiv.appendChild(butt);
        //     $(butt).click(this.showCodeCoach.bind(this));
        // }
        // Audio Tour
        if ($(this.origElem).data("audio")) {
            butt = document.createElement("button");
            $(butt).addClass("ac_opt btn btn-default");
            $(butt).text($.i18n("msg_activecode_audio_tour"));
            $(butt).css("margin-left", "10px");
            this.atButton = butt;
            ctrlDiv.appendChild(butt);
            $(butt).click(
                function () {
                    new AudioTour(
                        this.divid,
                        this.code,
                        1,
                        $(this.origElem).data("audio")
                    );
                }.bind(this)
            );
        }
        if (eBookConfig.isInstructor) {
            let butt = document.createElement("button");
            $(butt).addClass("btn btn-info");
            $(butt).text("Share Code");
            $(butt).css("margin-left", "10px");
            this.shareButt = butt;
            ctrlDiv.appendChild(butt);
            $(butt).click(
                function () {
                    if (
                        !confirm(
                            "You are about to share this code with ALL of your students.  Are you sure you want to continue?"
                        )
                    ) {
                        return;
                    }
                    let data = {
                        divid: this.divid,
                        code: this.editor.getValue(),
                        lang: this.language,
                    };
                    $.post(
                        "/runestone/ajax/broadcast_code.json",
                        data,
                        function (status) {
                            if (status.mess === "success") {
                                alert(
                                    `Shared Code with ${status.share_count} students`
                                );
                            } else {
                                alert("Sharing Failed");
                            }
                        },
                        "json"
                    );
                }.bind(this)
            );
        }



        // TODO: new code begins here !!!
        
         // back to my own code
        var thisCodeProblem;
        var myCode = document.createElement("button");
        $(myCode).addClass("ac_opt btn btn-default");
        $(myCode).text("My Code");
        $(myCode).css("margin-left", "10px");
        ctrlDiv.appendChild(myCode);
        var editor = this.editor;

        this.docMyCode = connection_codecontent.get(this.divid + newUser, "mycode");
        const currentCodeDoc = this.docMyCode;
        const problem_id = this.divid;

        currentCodeDoc.fetch(function (err) {
            if (err) throw err;
            if (currentCodeDoc.type === null) {
                currentCodeDoc.create(
                    {
                        code: editor.getValue(),
                    },
                    acallback
                );
                return;
            }
            acallback();
        });

        function acallback() {
            thisCodeProblem = new ShareDBCodeMirrorBinding(editor, currentCodeDoc);
        }

        // connected users
        var helpSession = connection_mini.get(problem_id, "helpSessionUser");
        
        var currentDocForHelpSession = helpSession;

        var connectedUserDiv = document.createElement("div");
        connectedUserDiv.id = "helpSession" + problem_id;

        ctrlDiv.appendChild(connectedUserDiv);

        // select answer position
        var answerInputSelectStart;
        var answerInputSelectEnd;
        var codePointer = new Array();
        var currentQuest;
        var currentCode;
        var currentQuestIndex;

        // add script
        // var newScript = document.createElement("script");
        // var inlineScript = document.createTextNode('function highlightCodeSelected(problemid,codestartline, codestartch,codeendline,codeendch) {$("#code" + problemid).children("div").remove(); var editor = CodeMirror.fromTextArea(document.getElementById("codeTextArea" + problemid), { lineNumbers: true, styleSelectedText: true }); console.log(editor);editor.getDoc().markText({line: codestartline, ch: codestartch}, {line: codeendline, ch: codeendch}, {css: "background: yellow"});}');
        // newScript.appendChild(inlineScript); 
        // ctrlDiv.appendChild(newScript);

        // help session

        // button for add new discussion
        const helpButton = document.createElement("button");
        $(helpButton).addClass("ac_opt btn btn-default");
        $(helpButton).text("Help");
        $(helpButton).css("margin-left", "10px");
        ctrlDiv.appendChild(helpButton);
            
        // button for cancel the input box
        const cancelButton = document.createElement("button");
        $(cancelButton).addClass("ac_opt btn btn-default");
        $(cancelButton).text("Cancel");
        $(cancelButton).css("margin-right", "10px");
        $(cancelButton).css("float", "right");
        cancelButton.style.display = 'none';
        cancelButton.id = "cancelButton" + problem_id;
        ctrlDiv.appendChild(cancelButton);

        // button for cancel the highlight
        const cancelHighLightButton = document.createElement("button");
        $(cancelHighLightButton).addClass("ac_opt btn btn-default");
        $(cancelHighLightButton).text("Cancel HighLight");
        $(cancelHighLightButton).css("margin-right", "10px");
        $(cancelHighLightButton).css("float", "right");
        cancelHighLightButton.style.display = 'none';
        cancelHighLightButton.id = "cancelHighLightButton" + problem_id;
        ctrlDiv.appendChild(cancelHighLightButton);

        // button for back to live answer code
        const liveCodeButton = document.createElement("button");
        $(liveCodeButton).addClass("ac_opt btn btn-default");
        $(liveCodeButton).text("Live Code");
        $(liveCodeButton).css("margin-right", "10px");
        $(liveCodeButton).css("float", "right");
        liveCodeButton.style.display = 'none';
        liveCodeButton.id = "liveCodeButton" + problem_id;
        ctrlDiv.appendChild(liveCodeButton);

        // discussion session

        // question list
        var questions = document.createElement("div");
        questions.id ="questions" + problem_id;
        questions.setAttribute(
            "style",
            "list-style-type: none; margin: 0; padding: 0; \
            display:block; overflow-y:scroll; max-height: 225px; \
            background: ivory;"
        );
        this.discussionDiv.appendChild(questions);
            
        const inputDiv = document.createElement("div");
        inputDiv.id = "inputDiv" + problem_id;
        inputDiv.setAttribute(
            "style",
            "position: absolute; bottom: 0; \
            width: 98%;  height: 20%; display: none;"
        );

        // question input div
        const inputQuest = document.createElement("div");
        inputQuest.id = "inputQuest" + problem_id;
        inputQuest.setAttribute(
            "style",
            "width: 80%; box-sizing: border-box; float: left;"
        );

        // input CodeMirror source text
        const inputTextArea = document.createElement("textarea");
        inputTextArea.id = "inputTextArea" + this.divid;
        inputQuest.appendChild(inputTextArea);
        inputDiv.appendChild(inputQuest);

        // question submit button
        const submitButton = document.createElement("button");
        $(submitButton).addClass("ac_opt btn btn-primary");
        $(submitButton).css("box-sizing", "border-box");
        $(submitButton).css("display", "block");
        $(submitButton).text("Submit Question");
        submitButton.id = "submitButton" + problem_id;

        submitButton.onclick = function () {                 
            addNewDiscussionSession(problem_id);
        };

        const buttonListDiv = document.createElement("div");
        $(buttonListDiv).css("width", "18%");
        $(buttonListDiv).css("float", "left");
        buttonListDiv.appendChild(submitButton);

        // answer code link button
        /*
        const answerLinkButton = document.createElement("button");
        $(answerLinkButton).addClass("ac_opt btn btn-primary");
        $(answerLinkButton).text("Link");
        $(answerLinkButton).css("box-sizing", "border-box");
        $(answerLinkButton).css("display", "none");
        */

        const answerLinkButton = document.createElement("button");
        $(answerLinkButton).addClass("ac_opt btn btn-default glyphicon glyphicon-paperclip");
        $(answerLinkButton).css("box-sizing", "border-box");
        $(answerLinkButton).css("display", "none");
        answerLinkButton.id = "answerLinkButton" + problem_id;

        answerLinkButton.onclick = function () {                 
            addNewCodeLink();
        };
        buttonListDiv.appendChild(answerLinkButton);

        // answer submit button
        const answerSubmitButton = document.createElement("button");
        $(answerSubmitButton).addClass("ac_opt btn btn-primary");
        $(answerSubmitButton).css("box-sizing", "border-box");
        $(answerSubmitButton).css("display", "none");
        $(answerSubmitButton).text("Submit Answer");
        answerSubmitButton.id = "answerSubmitButton" + problem_id;

        answerSubmitButton.onclick = function () {                 
            addNewDiscussionAnswer();
        };
        buttonListDiv.appendChild(answerSubmitButton);
        inputDiv.appendChild(buttonListDiv);
        this.discussionDiv.appendChild(inputDiv);

        const enterNotice = document.createElement("div");
        $(enterNotice).css("position", "absolute");
        $(enterNotice).css("bottom", "0px");
        enterNotice.innerHTML = "Enter to send / Shift+Enter to enter a new line";
        this.discussionDiv.appendChild(enterNotice);

        // create input code mirror
        var inputCodeMirror = CodeMirror.fromTextArea(document.getElementById("inputTextArea" + this.divid), {
            lineWrapping: true,
            styleSelectedText: true,
            mode: edmode,
            indentUnit: 4,
            matchBrackets: true,
            autoMatchParens: true,
            extraKeys: { Tab: "indentMore", 
                        "Shift-Tab": "indentLess", 
                        "Enter": function () 
                                {                 
                                    addNewDiscussionSessAns(problem_id);
                                }
                        },
        });

        inputCodeMirror.setSize(600, 65);
        var disSession = connection_mini.get(problem_id, "helpsession_discussion");
        var currentDocForDiscussion = disSession;
        currentDocForDiscussion.fetch(function(err) {
            if(err) throw err;
            currentDocForDiscussion.subscribe(showAllDiscussionSession);
            currentDocForDiscussion.on("op", showAllDiscussionSession);
            currentDocForDiscussion.on("create", showAllDiscussionSession);
        });
        

        // TODO: need to set each unique user a unique discussion list and discussion window !
        var discussionList = connection_mini.get('discussion', 'list');
        var discussionWindow = connection_mini.get('discussion', 'window');
        // create a table of user information
        //var userInfoTable = connection_mini.get('user', 'info');


        if (discussionWindow.type === null) {
            discussionWindow.create([]);
            var windowInfo = {
                size: 0,
            }
            discussionWindow.submitOp([{ p: [0], li: windowInfo}]);
        }

        /*
        if (userInfoTable.type === null) {
            userInfoTable.create([]);
            var userInfo = {
                // info 1: newUser + problem_id indicating whether this user finished this problem
                info: [],
            }
            userInfoTable.submitOp([{ p: [0], li: userInfo}]);
        }
        */


        // add the new discussion to the sideBar
        discussionList.fetch(function(err) {
            if(err) throw err;
            discussionList.subscribe(showAllDiscussionList);
            discussionList.on("op", showAllDiscussionList);
            discussionList.on("create", showAllDiscussionSession);
        });

        function showAllDiscussionList() {
            //console.log(problem_id);
            //console.log("gegsegsgsdr");
            // TODO: now each user's discussion list is the same
            if (discussionList.type != null) {
                var list = document.getElementById("sideBar");
                while(list.lastChild){
                    list.removeChild(list.lastChild);
                }
                discussionList.data.forEach((session) =>{
                    var question = session.question;
                    var chapter = session.chapter;
                    var listIndex = session.listIndex;
                    var time = session.time.split(",")[0];
                    var problemId = session.problemId.split("_")[2];
                    const search = document.getElementById("discussionList" + session.id);
                    if (!search) {
                        var contentA = document.createElement("a");
                        contentA.href = session.url;
                        $(contentA).css("text-decoration",  "none");
                        var content = document.createElement("div");
                        // outer div
                        content.id = "discussionList" + session.id;
                        $(content).css("border-bottom", "2px solid #dbdbdb");
                        $(content).css("cursor", "pointer");
                        // inner right div
                        var rightContent = document.createElement("div");
                        $(rightContent).css("float", "right");
                        $(rightContent).css("color", "#888");
                        $(rightContent).css("margin-right", "3px");
                        rightContent.innerHTML = time;

                        // inner left div
                        var leftContent = document.createElement("div");
                        leftContent.setAttribute(
                            "style", 
                            "margin-left: 10px; margin-right: 60px; word-break:break-all;"
                        );

                        var leftA = document.createElement("div");
                        leftA.id = "discussionList" + session.id + "leftA";
                        var leftB = document.createElement("div");
                        var leftC = document.createElement("div");
                        leftA.setAttribute(
                            "style", 
                            "font-size: 16px; font-weight: bold; line-height: 16px; margin-bottom:2px;"
                        );
                        leftA.innerHTML = "Q:" + question;
                        leftB.setAttribute(
                            "style", 
                            "font-size:14px;color: #80858A;"
                        );
                        leftB.innerHTML = chapter;
                        leftC.setAttribute(
                            "style", 
                            "font-size:12px;color: #80858A;"
                        );
                        leftC.innerHTML = "Activity: " + problemId + " " + "Index: " +  listIndex;
                        leftContent.appendChild(leftA);
                        leftContent.appendChild(leftB);
                        leftContent.appendChild(leftC);


                        content.appendChild(rightContent);
                        content.appendChild(leftContent);


                        content.onclick = function () {
                            readDiscussionList(session.index);
                        };

                        $(content).mousemove(function(){
                            $(content).css("background-color","#FFF8DC");
                        });
            

                        if (!session.clicked) {
                            $(content).css("background-color", "#FEF3F3");
                            $(leftA).css("color", "#900");
                            $(content).mouseleave(function(){
                                $(content).css("background-color","#FEF3F3");
                            });

                        } else {
                            $(content).css("background-color", "white");
                            $(leftA).css("color", "#30424D");
                            $(content).mouseleave(function(){
                                $(content).css("background-color","white");
                            });
                        }
                        contentA.appendChild(content);
                        list.prepend(contentA);

                    } else {
                        // check if it needs to change the color
                        if (session.clicked) {
                            document.getElementById("discussionList" + session.id + "leftA").style.color = "#30424D";
                            $(search).css("background-color", "white");
                            $(search).mouseleave(function(){
                                $(search).css("background-color","white");
                            });
                        }
                    }
                })


                var topInfo = document.createElement('div');
                topInfo.id = "topInfo";
                topInfo.setAttribute(
                    "style",
                    "background: #fff; height: 40px; z-index: 9999; \
                    top: 0px; border-bottom: 2px solid #dbdbdb; font-size: 23px;"
                );
                topInfo.innerHTML = "&nbsp;<span class='glyphicon glyphicon-info-sign' aria-hidden='true'></span>  &nbsp; Discussion List";
                if (!document.getElementById("topInfo")){
                    list.prepend(topInfo);
                }


                if (discussionWindow.type != null){
                    // var userInfoTable = connection_mini.get('user', 'info');
                    
                    if (discussionWindow.data[0].size != discussionList.data.length) {
                        
                        var countCircle = document.getElementById("globalCount");
                        var count = parseInt(countCircle.innerHTML);
                        $(countCircle).css("display", "");
                        countCircle.innerHTML = (count+1).toString();
                        document.getElementById("globalMenu").style.color = "red";

                        const currentLength = discussionList.data.length;
                        discussionWindow.data[0].size = currentLength;
                        discussionWindow.submitOp([{p: [0], ld: discussionWindow.data[0], li: discussionWindow.data[0]}]);
                        
                        // the current user has already run this problem, then display the pop window
                        // the current user is not the user who asked this problem, then display the pop window
                        var newDiscussion = discussionList.data[currentLength-1];
                        // var newDiscussion = discussionList.data[0];
                        var target = newUser + newDiscussion.problemId;

                        // TODO change the condition statement

                        var newUser = document.getElementsByClassName("loggedinuser")[0].innerHTML.split(': ')[1];
                        var data = { acid: newDiscussion.problemId};
                        jQuery
                        .getJSON(
                            eBookConfig.ajaxURL + "gethist.json",
                            data,
                            function (data, status, whatever) {
                                if ( data.history.length !== 0 && newDiscussion.user !== newUser){
                                    var windowPos = document.getElementById("popWindow");
                                    var integrated = document.createElement('div');
                                    $(integrated).css("border-bottom", "2px solid black");
                                    var content = document.createElement('a');
                                    content.onclick = function () {
                                        readDiscussionList(currentLength-1);
                                    };
                                    content.id = "windowDiv" + currentLength;
                                    content.href =  newDiscussion.url;

                                    var detail = "<b>" + "Problem:" + newDiscussion.question + "</b>" + "</br>" +
                                                "Chapter:" + newDiscussion.chapter + "</br>" +
                                                "Time:" + newDiscussion.time;
                                    content.innerHTML = detail;
                                    $(content).css("color", "black");
                                    $(content).css("font-size", "18px");
                                    $(content).css("display", "block");
                                    var countDown = document.createElement('a');
                                    countDown.innerHTML = "5 seconds";
                                    countDown.id = "countDown" + currentLength;
                                    $(countDown).css("display", "block");
                                    $(countDown).css("color", "black");
                                    $(countDown).css("font-size", "20px");
            
                                    integrated.appendChild(countDown);
                                    integrated.appendChild(content);
                                    windowPos.appendChild(integrated);
                                    $(windowPos).css("display", "");
                                    // count down the window
                                    var target = document.getElementById("countDown" + currentLength);
                                    setTimeout(() => {
                                        target.innerHTML = "4 seconds"; 
                                    }, 1000);
                                    setTimeout(() => {
                                        target.innerHTML = "3 seconds"; 
                                    }, 2000);
                                    setTimeout(() => {
                                        target.innerHTML = "2 seconds";  
                                    }, 3000);
                                    setTimeout(() => {
                                        target.innerHTML = "1 seconds"; 
                                    }, 4000);
                                    setTimeout(() => {
                                        target.innerHTML = "0 seconds";
                                        windowPos.removeChild(windowPos.childNodes[1]);
                                        if (windowPos.childNodes.length == 1){
                                            windowPos.style.display = "none";
                                        }
                                    }, 5000);
                                }

                            }.bind(this)
                        )

                    } 
                }
            }
        }

        function readDiscussionList(index) {
            if (!discussionList.data[index].clicked){
                discussionList.data[index].clicked = true;
                discussionList.submitOp([{ p: [index], ld: discussionList.data[index], li:discussionList.data[index]}]);
                var countCircle = document.getElementById("globalCount");
                var count = parseInt(countCircle.innerHTML);
                
                if (count == 1){
                    $(countCircle).css("display", "none");
                    document.getElementById("globalMenu").style.color = "";
                    countCircle.innerHTML = 0;
                } else {
                    if (count > 1){
                        countCircle.innerHTML = (count-1).toString();
                    }
                }
            }
        }
        
        function showAllDiscussionSession() {
            $("#questions" + problem_id)
                .children("div")
                .remove();
            if (currentDocForDiscussion.type != null) {
                let index = 1;
                currentDocForDiscussion.data.forEach((session) => {
                    // var userName = session.user;
                    var question = session.question;
                    var questId = session.id;
                    var code = session.code;
                    var time = session.time;
                    var quest = document.createElement("div");
                    quest.onclick = function() { showQuestDetail(questId, code, session.index); };
                    quest.setAttribute("style", "height:30px; border: solid 2px #dbdbdb; border-style: solid solid none solid; cursor: pointer;");
                    if (index === currentDocForDiscussion.data.length){
                        quest.setAttribute("style", "height:30px; border: solid 2px #dbdbdb; cursor: pointer;");
                    }
                    $(quest).mousemove(function(){
                        $(quest).css("background","#eeeeee");
                    });
                    $(quest).mouseleave(function(){
                        $(quest).css("background","ivory");
                    });
                    var leftQuest = document.createElement("div");
                    var rightQuest = document.createElement("div");
                    $(leftQuest).css("float", "left");
                    $(leftQuest).css("margin-top", "4px");
                    $(leftQuest).css("margin-left", "2px");
                    $(rightQuest).css("float", "right");
                    $(rightQuest).css("margin-top", "4px");
                    $(rightQuest).css("margin-right", "2px");

                    var questionIndex = document.createElement("b");
                    questionIndex.id = "question" + questId;
                    questionIndex.innerHTML = "Q" + index + ":";
                    ++index;
                    leftQuest.appendChild(questionIndex);
                    var q = document.createTextNode(question);
                    leftQuest.appendChild(q);
                    
                    var t = document.createTextNode(time);
                    rightQuest.appendChild(t);

                    quest.appendChild(leftQuest);
                    quest.appendChild(rightQuest);

                    $("#questions" + problem_id).append(quest);

                    var disDiv = document.getElementById("discussionDiv" + problem_id);

                    const detailDiv = document.getElementById("detailDiv" + problem_id + questId);

                    if (!detailDiv) {
                        const detailDiv = document.createElement("div");
                        detailDiv.id = "detailDiv" + problem_id + questId;
                        $(detailDiv).addClass("detailDiv" + problem_id);
                        $(detailDiv).css("display", "none");
                        $(detailDiv).css("background", "ivory");
                        $(detailDiv).css("overflow", "auto");
                        $(detailDiv).css("height", "325px");
                        $(detailDiv).css("word-break", "break-all");

                        var problemTitle = document.createElement("div");
                        problemTitle.setAttribute("style", "border: solid 2px #dbdbdb; height:48px; overflow:auto;");

                        var returnButton = document.createElement("button");
                        $(returnButton).addClass("ac_opt btn btn-default");
                        $(returnButton).css("font-size", "10px");
                        $(returnButton).css("float", "left");
                        var fig = document.createElement("span");
                        $(fig).addClass("glyphicon glyphicon-arrow-left");
                        $(fig).css("aria-hidden", "true");
                        returnButton.appendChild(fig);
                        returnButton.onclick = function() { showTitles(problem_id, questId); };
                        problemTitle.appendChild(returnButton);

                        var titleLeft = document.createElement("div");
                        var titleRight = document.createElement("div");

                        $(titleLeft).css("float", "left");
                        $(titleLeft).css("margin-top", "10px");
                        $(titleRight).css("float", "right");
                        $(titleRight).css("margin-top", "10px");
                        $(titleRight).css("margin-right", "5px");
        
                        var titleIndex = document.createElement("b");
                        titleIndex.innerHTML = "Q" + (index-1) + ":";
                        titleLeft.appendChild(titleIndex);
                        var titleQ = document.createTextNode(question);
                        titleLeft.appendChild(titleQ);
                        
                        var titleT = document.createTextNode(time);
                        titleRight.appendChild(titleT);

                        problemTitle.appendChild(titleLeft);
                        problemTitle.appendChild(titleRight);

                        detailDiv.appendChild(problemTitle);
                        disDiv.appendChild(detailDiv);
                    }

                    const detailsDiv = document.getElementById("detailDiv" + problem_id + questId);
                    var num = detailsDiv.childNodes.length;
                    for (var i = num-1; i >= 1; --i){
                        detailsDiv.removeChild(detailsDiv.childNodes[i]);
                    }
                    // $(detailsDiv)
                    //    .children("div")
                    //    .remove();
                    
                    if(session.chat.length != 0) {
                        let count = 0;
                        session.chat.forEach((ans) => {
                            ++count;
                            var responseDiv = document.createElement("div");
                                                    
                            responseDiv.setAttribute("style",
                                "padding: 5px; text-align: left; \
                                border-left: solid 2px #dbdbdb; border-right: solid 2px #dbdbdb; ");

                            $(responseDiv).mousemove(function(){
                                $(responseDiv).css("background-color","#eeeeee");
                            });

                            $(responseDiv).mouseleave(function(){
                                $(responseDiv).css("background-color","ivory");
                            });
                            $(responseDiv).css("border-left","solid 2px #dbdbdb");
                            $(responseDiv).css("border-right","solid 2px #dbdbdb");


                            var answer = ans.answer;
                            var index = 0;
                            if(ans.index == 0 || session.chat[ans.index].user != session.chat[ans.index - 1].user) {
                                var user = document.createElement("div");
                                $(user).text(ans.user);
                                user.setAttribute(
                                    "style",
                                    "font-size: 11px; font-weight: bold; margin-left: 28px;"
                                );
                                responseDiv.appendChild(user);
                                $(responseDiv).css("border-top","solid 2px #dbdbdb");
                            }

                            // console.log(ans.pointers);
                            if (ans.pointers != null) {

                                // may need debug 
                                // not test
                                ans.pointers.forEach((pointer) => {
                                    var text = answer.substring(index, pointer.answerStart.ch);
                                    if (ans.code != null){
                                        var textSpan = document.createElement("span");
                                    } else {
                                        var textSpan = document.createElement("div");
                                    }
                                    textSpan.innerText = text;
                                    responseDiv.appendChild(textSpan);
                                    var aText = answer.substring(pointer.answerStart.ch, pointer.answerEnd.ch);
                                    var aPointer = document.createElement("a");
                                    aPointer.innerText = aText;
                                    aPointer.href = "javascript:void(0);";
                                    aPointer.onclick = function () {                 
                                        highlightCodeSelected(session.index, ans.index, pointer.codeStart.line, pointer.codeStart.ch, pointer.codeEnd.line, pointer.codeEnd.ch, edmode);
                                    };
                                    responseDiv.appendChild(aPointer);
                                    index = pointer.answerEnd.ch;
                                })
                            }

                            if (index < answer.length) {
                                var text = answer.substring(index, answer.length);
                                var textSpan = document.createElement("span");
                                textSpan.innerText = text;
                               // if (ans.code == null || ans.index == 0){
                                    $(textSpan).css("margin-left", "28px");
                               // }
                                responseDiv.appendChild(textSpan);

                                var textTime = document.createElement("span");
                                textTime.innerText = ans.time;
                                $(textTime).css("float", "right");

                                responseDiv.appendChild(textTime);
                            }

                            if (ans.code != null) {
                                if (ans.index != 0){

                                    var notice = document.createElement("div");
                                    notice.setAttribute(
                                        "style",
                                        "text-align:center;color:grey;cursor:pointer;"
                                    );
                                    $(notice).text("Code edited (Click to show the difference)");
                                    notice.onclick = function () {                 
                                        showAnswerCode(session.index, questId, ans.index);
                                    };
                                    responseDiv.appendChild(notice);

                                    var diffDiv = document.createElement("div");
                                    diffDiv.id = "diff" + problem_id + session.index + questId + ans.index;
                                    $(diffDiv).addClass("col-md-12");
                                    $(diffDiv).css("background", "#ffffff");
                                    $(diffDiv).css("border", "solid 2px #dbdbdb");
                                    $(diffDiv).css("max-height", "300px");
                                    $(diffDiv).css("overflow", "auto");
                                    $(diffDiv).css("float", "none");
                                    $(diffDiv).css("display", "none");
  

                                    // const showCodeButton = document.createElement("button");
                                    // // $(showCodeButton).css("float", "right");
                                    // $(showCodeButton).text("C");
                                    // showCodeButton.title = "Show Code";
                                    // showCodeButton.setAttribute(
                                    //     "style",
                                    //     "width: 28px; height: 28px; border-radius: 50%; border: solid 1px black;"
                                    // );
            
                                    // showCodeButton.id = "showCodeButton" + questId + ans.index;
                                    // showCodeButton.onclick = function () {                 
                                    //     showAnswerCode(session.index, questId, ans.index);
                                    // };
                                    responseDiv.appendChild(diffDiv);
                                }
                            }

                            
                            if (count == session.chat.length){
                                // the last element
                                $(responseDiv).css("border-bottom","solid 2px #dbdbdb");
                            }

                            detailsDiv.appendChild(responseDiv);
                        })
                        ;
                    }
                    // scroll the div into the bottom
                    var objDiv = document.getElementById("detailDiv" + problem_id + questId);
                    $(objDiv).scrollTop(objDiv.scrollHeight);
                });
            }
        }

        function showTitles() {
            const currentCodeDoc = connection_codecontent.get(problem_id + newUser, "mycode");

            var detailDivs = document.getElementsByClassName("detailDiv" + problem_id);
            var i;
            for (i = 0; i < detailDivs.length; i++) {
                detailDivs[i].style.display = 'none';
            }
            var answerDivs = document.getElementsByClassName("answerDiv" + problem_id);
            for (i = 0; i < answerDivs.length; i++) {
                answerDivs[i].style.display = 'none';
            }
            document.getElementById("questions" + problem_id).style.display = 'block';
            document.getElementById("inputDiv" + problem_id).style.display = 'none';
            document.getElementById("answerLinkButton" + problem_id).style.display = 'none';
            document.getElementById("answerSubmitButton" + problem_id).style.display = 'none';
            document.getElementById("submitButton" + problem_id).style.display = 'block';
            document.getElementById("cancelHighLightButton" + problem_id).style.display = 'none';
            document.getElementById("inputDiv" + problem_id).style.display = 'block';
            // document.getElementById("diffDiv" + problem_id).style.display = 'none';
            document.getElementById("liveCodeButton" + problem_id).style.display = 'none';

            var codeEditorWindow = $("div#" + problem_id + " > .ac_code_div");

            if (codeEditorWindow.hasClass("col-md-10")) {
                codeEditorWindow.addClass("col-md-6").removeClass("col-md-10");
            }
            helpSession.destroy();
            currentCodeDoc.fetch(function (err) {
                if (err) throw err;
                if (currentCodeDoc.type === null) {
                    currentCodeDoc.create(
                        {
                            code: editor.getValue(),
                        },
                        acallback
                    );
                    return;
                }
                acallback();
            });
        }
        $(myCode).click(showTitles);

        function showQuestDetail(questId, questCode, questIndex) {
            currentQuest = questId;
            currentCode = questCode;
            currentQuestIndex = questIndex;
            document.getElementById("questions" + problem_id).style.display = 'none';
            document.getElementById("inputDiv" + problem_id).style.display = 'block';
            document.getElementById("answerLinkButton" + problem_id).style.display = 'block';
            document.getElementById("answerSubmitButton" + problem_id).style.display = 'block';
            document.getElementById("submitButton" + problem_id).style.display = 'none';
            document.getElementById("detailDiv" + problem_id + currentQuest).style.display = 'block';

            const DisSessionDoc = connection_codecontent.get(
                problem_id,
                "disSession" + currentQuest
            );
            
            thisCodeProblem.destroy();

            DisSessionDoc.fetch(function (err) {
                if (err) throw err;
                if (DisSessionDoc.type === null) {
                    DisSessionDoc.create(
                        {
                            code: currentCode,
                        },
                        acallback
                    );
                    return;
                }
                acallback();
            });

            function acallback() {
                helpSession = new ShareDBCodeMirrorBinding(editor, DisSessionDoc);
            }
        }


        function addNewDiscussionSessAns(problem_id) {
            if (document.getElementById("submitButton" + problem_id).style.display != 'none'){
                addNewDiscussionSession(problem_id);
            } else {
                addNewDiscussionAnswer();
            }
        }

        function addNewDiscussionSession(problem_id) {
            var listIndex = document.getElementById("questions" + problem_id).childNodes.length;
            if(inputCodeMirror.getValue() != "") {
                currentDocForDiscussion.fetch(function (err) {
                    if (err) throw err;
                    if (currentDocForDiscussion.type === null) {
                        currentDocForDiscussion.create([]);
                    }
                    if (discussionList.type === null) {
                        discussionList.create([]);
                    }
                    var dataLength = currentDocForDiscussion.data.length;
                    var newData = {
                        index: dataLength,
                        user: newUser,
                        question: inputCodeMirror.getValue(),
                        chat: [],
                        code: editor.getValue(),
                        id: String(new Date().getTime()),
                        time: String(new Date().toLocaleTimeString(['en'], {year: '2-digit',  month: 'numeric',  day: 'numeric', hour: '2-digit', minute:'2-digit'})),
                    };

                    currentDocForDiscussion.submitOp([{ p: [dataLength], li: newData }]);

                    var listLength = discussionList.data.length;
                    //console.log(discussionList.data);
                    //console.log("debug");
                    var curUser = document.getElementsByClassName("loggedinuser")[0].innerHTML.split(': ')[1];
                    // add the question to the global menu
                    var newList = {
                        index: listLength,
                        question: inputCodeMirror.getValue(),
                        chapter: document.title.split("—")[0],
                        listIndex: listIndex+1,
                        time: String(new Date().toLocaleTimeString(['en'], {year: '2-digit',  month: 'numeric',  day: 'numeric', hour: '2-digit', minute:'2-digit'})),
                        clicked: false,
                        id: String(new Date().getTime()),
                        url: currentUrl + "#" + problem_id,
                        user: curUser,
                        problemId: problem_id,
                    };
                    discussionList.submitOp([{p: [listLength], li: newList}]);

                    inputCodeMirror.getDoc().setValue("");
                    inputCodeMirror.toTextArea();
                    var newInputCodeMirror = CodeMirror.fromTextArea(document.getElementById("inputTextArea" + problem_id), {
                        lineWrapping: true,
                        styleSelectedText: true,
                        mode: edmode,
                        indentUnit: 4,
                        matchBrackets: true,
                        autoMatchParens: true,
                        extraKeys: { Tab: "indentMore", 
                                    "Shift-Tab": "indentLess", 
                                    "Enter": function () 
                                            {                 
                                                addNewDiscussionSessAns(problem_id);
                                            }
                                    },
                    });
                    newInputCodeMirror.setSize(600, 65);
                    inputCodeMirror = newInputCodeMirror;
                });

            }
        }

        function addNewDiscussionAnswer() {
            var answerIndex = currentDocForDiscussion.data[currentQuestIndex].chat.length;
            var answerValue = inputCodeMirror.getValue();
            if (answerValue != "") {
                var answerCode = editor.getValue();
                var latestNewCode = answerIndex;
                if (answerIndex != 0 && answerCode == currentDocForDiscussion.data[currentQuestIndex].chat[currentDocForDiscussion.data[currentQuestIndex].chat[answerIndex - 1].latestNewCodeIndex].code) {
                    answerCode = null;
                    latestNewCode = currentDocForDiscussion.data[currentQuestIndex].chat[answerIndex - 1].latestNewCodeIndex;
                }
                var newData = {
                    index: answerIndex,
                    user: newUser,
                    code: answerCode,
                    answer: answerValue,
                    pointers: codePointer,
                    latestNewCodeIndex: latestNewCode,
                    id: String(new Date().getTime()),
                    time: String(new Date().toLocaleTimeString(['en'], {year: '2-digit',  month: 'numeric',  day: 'numeric', hour: '2-digit', minute:'2-digit'}))
                };
                currentDocForDiscussion.data[currentQuestIndex].chat.push(newData);
                currentDocForDiscussion.submitOp([{ p: [currentQuestIndex],
                    ld: currentDocForDiscussion.data[currentQuestIndex],
                    li: currentDocForDiscussion.data[currentQuestIndex]}]);
                inputCodeMirror.getDoc().setValue("");
                inputCodeMirror.toTextArea();
                var newInputCodeMirror = CodeMirror.fromTextArea(document.getElementById("inputTextArea" + problem_id), {
                    lineWrapping: true,
                    styleSelectedText: true,
                    mode: edmode,
                    indentUnit: 4,
                    matchBrackets: true,
                    autoMatchParens: true,
                    extraKeys: { Tab: "indentMore", 
                                "Shift-Tab": "indentLess", 
                                "Enter": function () 
                                        {                 
                                            addNewDiscussionSessAns(problem_id);
                                        }
                                },
                });
                newInputCodeMirror.setSize(600, 65);
                inputCodeMirror = newInputCodeMirror;
                codePointer.length = 0;
            } 
        }

        function showAnswerCode(questIndex, questId, answerIndex) {
            var displayDiv = document.getElementById("diff" + problem_id + questIndex + questId + answerIndex );
            if (displayDiv.style.display == ""){
                displayDiv.style.display = "none";
                return;
            }
            var currentChat = currentDocForDiscussion.data[questIndex].chat[answerIndex];
            var curDate = getDate(new Date(parseInt(currentChat.id)));
            var curCode = currentChat.code;

            if(answerIndex != 0) {
                var prevChat = currentDocForDiscussion.data[questIndex].chat[currentDocForDiscussion.data[questIndex].chat[answerIndex - 1].latestNewCodeIndex];
                var prevDate = getDate(new Date(parseInt(prevChat.id)));
                var prevCode = prevChat.code;
            } else {
                var prevDate = curDate;
                var prevCode = curCode;
            }
            var diff = difflib.unifiedDiff(prevCode.split('\n'), curCode.split('\n'), 
            {fromfile: 'Previous', tofile: 'Current',fromfiledate: prevDate, tofiledate: curDate,lineterm: ''});


            var Textdiff = "";
            for(var i = 0; i < diff.length; i++) {
                Textdiff = Textdiff + diff[i] + "\n";
            }

            var diffHtml = Diff2Html.html(Textdiff, {
                drawFileList: true,
                matching: 'lines',
                drawFileList: false,
                outputFormat: 'line-by-line',
            });
            displayDiv.innerHTML = diffHtml;

            document.getElementById("liveCodeButton" + problem_id).style.display = 'block';
            displayDiv.style.display = "";

            
            // helpSession.destroy();
            // editor.getDoc().setValue(curCode);
            // editor.toTextArea();
            // var newEditor = CodeMirror.fromTextArea(document.getElementById("codeTextArea" + problem_id), {
            //     lineNumbers: true,
            //     styleSelectedText: true,
            //     mode: edmode,
            //     indentUnit: 4,
            //     matchBrackets: true,
            //     autoMatchParens: true,
            //     readOnly: true,
            //     extraKeys: { Tab: "indentMore", "Shift-Tab": "indentLess" },
            // });
            // editor = newEditor;
        }

        function getDate(d) {
            var formattedDate =  (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear();
            var hours = (d.getHours() < 10) ? "0" + d.getHours() : d.getHours();
            var minutes = (d.getMinutes() < 10) ? "0" + d.getMinutes() : d.getMinutes();
            var formattedTime = hours + ":" + minutes;
            return(formattedDate + " " + formattedTime);
        }

        function addNewCodeLink() {
            var pos = document.getElementById("navbar");
            var popWindow = document.createElement('div');
            $(popWindow).css("position", "fixed");
            $(popWindow).css("right", "20px");
            $(popWindow).css("bottom", "20px");
            $(popWindow).css("background-color", "#CCFFFF");
            $(popWindow).css("z-index", "99999");
            $(popWindow).css("font-size", "18px");
            
            if ($("#answerLinkButton" + problem_id)[0].innerHTML == "Link") {
                var codeSelectStart = editor.getCursor(true);
                var codeSelectEnd = editor.getCursor(false);
                if (answerInputSelectStart != null && answerInputSelectEnd != null && codeSelectStart != codeSelectEnd) {
                    if(answerInputSelectEnd.line == answerInputSelectStart.line && answerInputSelectEnd.ch == answerInputSelectStart.ch) {
                        answerInputSelectStart.line = 0;
                        answerInputSelectStart.ch = 0;
                    }

                    var dataLength = codePointer.length;
                    var newData = {
                        index: dataLength,
                        user: newUser,
                        id: String(new Date().getTime()),
                        codeStart: codeSelectStart,
                        codeEnd: codeSelectEnd,
                        answerStart: answerInputSelectStart,
                        answerEnd: answerInputSelectEnd
                    };
                    codePointer.push(newData);
                    answerInputSelectStart = 0;
                    answerInputSelectEnd = 0;
                    $("#answerLinkButton" + problem_id).addClass("glyphicon glyphicon-paperclip");
                    $("#answerLinkButton" + problem_id)[0].innerHTML = "";
                    popWindow.innerHTML = "Link successfully.";
                    pos.insertBefore(popWindow, pos.childNodes[0]);
                    setTimeout(() => {
                        pos.removeChild(pos.childNodes[0]);
                    }, 5000);
                }
            }
            else {
                var inputSelectStart = inputCodeMirror.getCursor(true);
                var inputSelectEnd = inputCodeMirror.getCursor(false);
                answerInputSelectStart = inputSelectStart;
                answerInputSelectEnd = inputSelectEnd;
                popWindow.innerHTML = "Please select code in editor and then link them.";
                pos.insertBefore(popWindow, pos.childNodes[0]);
                setTimeout(() => {
                    pos.removeChild(pos.childNodes[0]);
                }, 5000);
                $("#answerLinkButton" + problem_id).removeClass("glyphicon glyphicon-paperclip");
                $("#answerLinkButton" + problem_id)[0].innerHTML = "Link";
            }
        }

        function highlightCodeSelected(questIndex, answerIndex, startLine, startCh, endLine, endCh, edmode) {
            // document.getElementById("diffDiv" + problem_id).style.display = "none";
            document.getElementById("liveCodeButton" + problem_id).style.display = 'block';
            helpSession.destroy();
            editor.getDoc().setValue(currentDocForDiscussion.data[questIndex].chat[answerIndex].code);
            editor.toTextArea();
            var newEditor = CodeMirror.fromTextArea(document.getElementById("codeTextArea" + problem_id), {
                lineNumbers: true,
                styleSelectedText: true,
                mode: edmode,
                indentUnit: 4,
                matchBrackets: true,
                autoMatchParens: true,
                readOnly: true,
                extraKeys: { Tab: "indentMore", "Shift-Tab": "indentLess" },
            });
            newEditor.getDoc().markText({line: startLine, ch: startCh}, {line: endLine, ch: endCh}, {css: "background: yellow"});
            editor = newEditor;
        }

        $(helpButton).click(showNewHelpSubmit);
        $(cancelButton).click(cancelHelpSession);
        $(cancelHighLightButton).click(cancelHighLight);
        $(liveCodeButton).click(returnLiveCode);

        function showNewHelpSubmit() {
            document.getElementById("cancelButton" + problem_id).style.display = 'block';
            document.getElementById("inputDiv" + problem_id).style.display = 'inline-block';
            document.getElementById("answerLinkButton" + problem_id).style.display = 'none';
            document.getElementById("answerSubmitButton" + problem_id).style.display = 'none';
            document.getElementById("submitButton" + problem_id).style.display = 'inline-block';
            document.getElementById("discussionDiv" + problem_id).style.height = '420px';
            document.getElementById("discussionDiv" + problem_id).style.display = '';
        }

        function cancelHelpSession() {
            if (document.getElementById("answerSubmitButton" + problem_id).style.display != 'none'){
                showTitles();
                //console.log("back");
            }
            /*
            currentDocForHelpSession.fetch(function (err) {
                if (err) throw err;
                var dataLength = currentDocForHelpSession.data.length;
                currentDocForHelpSession.submitOp([{ p: [dataLength -  1], ld: currentDocForHelpSession.data[dataLength - 1] }]);
            });
            inputCodeMirror.getDoc().setValue("");
            inputCodeMirror.toTextArea();
            var newInputCodeMirror = CodeMirror.fromTextArea(document.getElementById("inputTextArea" + problem_id), {
                lineWrapping: true,
                styleSelectedText: true,
                mode: edmode,
                indentUnit: 4,
                matchBrackets: true,
                autoMatchParens: true,
                extraKeys: { Tab: "indentMore", 
                            "Shift-Tab": "indentLess", 
                            "Enter": function () 
                                    {                 
                                        addNewDiscussionSessAns(problem_id);
                                    }
                            },
            });
            newInputCodeMirror.setSize(600, 65);
            inputCodeMirror = newInputCodeMirror;
            */

            document.getElementById("cancelButton" + problem_id).style.display = 'none';
            document.getElementById("inputDiv" + problem_id).style.display = 'none';
            document.getElementById("discussionDiv" + problem_id).style.display = 'none';
        }

        function cancelHighLight() {
            editor.toTextArea();
            var newEditor = CodeMirror.fromTextArea(document.getElementById("codeTextArea" + problem_id), {
                lineNumbers: true,
                styleSelectedText: true,
                mode: edmode,
                indentUnit: 4,
                matchBrackets: true,
                autoMatchParens: true,
                readOnly: true,
                extraKeys: { Tab: "indentMore", "Shift-Tab": "indentLess" },
            });
            editor = newEditor;
            document.getElementById("cancelHighLightButton" + problem_id).style.display = 'none';
            document.getElementById("liveCodeButton" + problem_id).style.display = 'block';
        }

        function returnLiveCode() {
            // document.getElementById("diffDiv" + problem_id).style.display = "none";
            document.getElementById("liveCodeButton" + problem_id).style.display = 'none';

            const DisSessionDoc = connection_codecontent.get(
                problem_id,
                "disSession" + currentQuest
            );
            
            DisSessionDoc.fetch(function (err) {
                if (err) throw err;
                if (DisSessionDoc.type === null) {
                    DisSessionDoc.create(
                        {
                            code: currentCode,
                        },
                        acallback
                    );
                    return;
                }
                acallback();
            });

            function acallback() {
                editor.getDoc().setValue(DisSessionDoc.data.code);
                editor.toTextArea();
                var newEditor = CodeMirror.fromTextArea(document.getElementById("codeTextArea" + problem_id), {
                    lineNumbers: true,
                    styleSelectedText: true,
                    mode: edmode,
                    indentUnit: 4,
                    matchBrackets: true,
                    autoMatchParens: true,
                    extraKeys: { Tab: "indentMore", "Shift-Tab": "indentLess" },
                });
                editor = newEditor;
                helpSession = new ShareDBCodeMirrorBinding(editor, DisSessionDoc);
            }
        }

        if (this.enablePartner) {
            var checkPartner = document.createElement("input");
            checkPartner.type = "checkbox";
            checkPartner.id = `${this.divid}_part`;
            ctrlDiv.appendChild(checkPartner);
            var plabel = document.createElement("label");
            plabel.for = `${this.divid}_part`;
            $(plabel).text("Pair?");
            ctrlDiv.appendChild(plabel);
            $(checkPartner).click(
                function () {
                    if (this.partner) {
                        this.partner = false;
                        $(partnerTextBox).hide();
                        this.partner = "";
                        partnerTextBox.value = "";
                        $(plabel).text("Pair?");
                    } else {
                        let didAgree = localStorage.getItem("partnerAgree");
                        if (!didAgree) {
                            didAgree = confirm(
                                "Pair Programming should only be used with the consent of your instructor." +
                                    "Your partner must be a registered member of the class and have agreed to pair with you." +
                                    "By clicking OK you certify that both of these conditions have been met."
                            );
                            if (didAgree) {
                                localStorage.setItem("partnerAgree", "true");
                            } else {
                                return;
                            }
                        }
                        this.partner = true;
                        $(plabel).text("with: ");
                        $(partnerTextBox).show();
                    }
                }.bind(this)
            );
            var partnerTextBox = document.createElement("input");
            partnerTextBox.type = "text";
            ctrlDiv.appendChild(partnerTextBox);
            $(partnerTextBox).hide();
            $(partnerTextBox).change(
                function () {
                    this.partner = partnerTextBox.value;
                }.bind(this)
            );
        }
        if (this.chatcodes && eBookConfig.enable_chatcodes) {
            var chatBar = document.createElement("div");
            var channels = document.createElement("span");
            var topic = window.location.host + "-" + this.divid;
            ctrlDiv.appendChild(chatBar);
            $(chatBar).text("Chat: ");
            $(chatBar).append(channels);
            butt = document.createElement("a");
            $(butt).addClass("ac_opt btn btn-default");
            $(butt).text("Create Channel");
            $(butt).css("margin-left", "10px");
            $(butt).attr("type", "button");
            $(butt).attr("target", "_blank");
            $(butt).attr(
                "href",
                "http://" +
                    chatcodesServer +
                    "/new?" +
                    $.param({
                        topic: window.location.host + "-" + this.divid,
                        code: this.editor.getValue(),
                        lang: "Python",
                    })
            );
            this.chatButton = butt;
            chatBar.appendChild(butt);
            var updateChatCodesChannels = function () {
                var data = doc.data;
                var i = 1;
                $(channels).html("");
                data["channels"].forEach(function (channel) {
                    if (!channel.archived && topic === channel.topic) {
                        var link = $("<a />");
                        var href =
                            "http://" +
                            chatcodesServer +
                            "/" +
                            channel.channelName;
                        link.attr({
                            href: href,
                            target: "_blank",
                        });
                        link.text(" " + channel.channelName + "(" + i + ") ");
                        $(channels).append(link);
                        i++;
                    }
                });
                if (i === 1) {
                    $(channels).text(
                        "(no active converstations on this problem)"
                    );
                }
            };
            doc.subscribe(updateChatCodesChannels);
            doc.on("op", updateChatCodesChannels);
        }
        $(this.outerDiv).prepend(ctrlDiv);
        this.controlDiv = ctrlDiv;
    }
    
    enableSaveLoad() {
        $(this.runButton).text($.i18n("msg_activecode_save_run"));
    }
    // Activecode -- If the code has not changed wrt the scrubber position value then don't save the code or reposition the scrubber
    //  -- still call runlog, but add a parameter to not save the code
    // add an initial load history button
    // if there is no edit then there is no append   to_save (True/False)
    addHistoryScrubber(pos_last) {
        var data = {
            acid: this.divid,
        };
        var deferred = jQuery.Deferred();
        if (this.sid !== undefined) {
            data["sid"] = this.sid;
        }
        console.log("before get hist");
        var helper = function () {
            console.log("making a new scrubber");
            var scrubberDiv = document.createElement("div");
            $(scrubberDiv).css("display", "inline-block");
            $(scrubberDiv).css("margin-left", "10px");
            $(scrubberDiv).css("margin-right", "10px");
            $(scrubberDiv).css({
                "min-width": "200px",
                "max-width": "300px",
            });
            var scrubber = document.createElement("div");
            this.timestampP = document.createElement("span");
            this.slideit = function () {
                this.editor.setValue(this.history[$(scrubber).slider("value")]);
                var curVal = this.timestamps[$(scrubber).slider("value")];
                let pos = $(scrubber).slider("value");
                let outOf = this.history.length;
                $(this.timestampP).text(`${curVal} - ${pos + 1} of ${outOf}`);
                this.logBookEvent({
                    event: "activecode",
                    act: "slide:" + curVal,
                    div_id: this.divid,
                });
            };
            $(scrubber).slider({
                max: this.history.length - 1,
                value: this.history.length - 1,
            });
            $(scrubber).css("margin", "10px");
            $(scrubber).on("slide", this.slideit.bind(this));
            $(scrubber).on("slidechange", this.slideit.bind(this));
            scrubberDiv.appendChild(scrubber);
            scrubberDiv.appendChild(this.timestampP);
            // If there is a deadline set then position the scrubber at the last submission
            // prior to the deadline
            if (this.deadline) {
                let i = 0;
                let done = false;
                while (i < this.history.length && !done) {
                    if (new Date(this.timestamps[i]) > this.deadline) {
                        done = true;
                    } else {
                        i += 1;
                    }
                }
                i = i - 1;
                scrubber.value = Math.max(i, 0);
                this.editor.setValue(this.history[scrubber.value]);
                $(scrubber).slider("value", scrubber.value);
            } else if (pos_last) {
                scrubber.value = this.history.length - 1;
                this.editor.setValue(this.history[scrubber.value]);
            } else {
                scrubber.value = 0;
            }
            let pos = $(scrubber).slider("value");
            let outOf = this.history.length;
            let ts = this.timestamps[$(scrubber).slider("value")];
            $(this.timestampP).text(`${ts} - ${pos + 1} of ${outOf}`);
            $(this.histButton).remove();
            this.histButton = null;
            this.historyScrubber = scrubber;
            $(scrubberDiv).insertAfter(this.runButton);
            deferred.resolve();
        }.bind(this);
        if (eBookConfig.practice_mode) {
            helper();
        } else {
            jQuery
                .getJSON(
                    eBookConfig.ajaxURL + "gethist.json",
                    data,
                    function (data, status, whatever) {
                        if (data.history !== undefined) {
                            this.history = this.history.concat(data.history);
                            for (let t in data.timestamps) {
                                this.timestamps.push(
                                    new Date(
                                        data.timestamps[t]
                                    ).toLocaleString()
                                );
                            }
                        }
                    }.bind(this)
                )
                .always(helper); // For an explanation, please look at https://stackoverflow.com/questions/336859/var-functionname-function-vs-function-functionname
        }
        return deferred;
    }
    createOutput() {
        // Create a parent div with two elements:  pre for standard output and a div
        // to hold turtle graphics output.  We use a div in case the turtle changes from
        // using a canvas to using some other element like svg in the future.
        var outDiv = document.createElement("div");
        $(outDiv).addClass("ac_output col-md-12");
        this.outDiv = outDiv;
        this.output = document.createElement("pre");
        this.output.id = this.divid + "_stdout";
        $(this.output).css("visibility", "hidden");
        this.graphics = document.createElement("div");
        this.graphics.id = this.divid + "_graphics";
        $(this.graphics).addClass("ac-canvas");
        // This bit of magic adds an event which waits for a canvas child to be created on our
        // newly created div.  When a canvas child is added we add a new class so that the visible
        // canvas can be styled in CSS.  Which a the moment means just adding a border.
        $(this.graphics).on(
            "DOMNodeInserted",
            "canvas",
            function (e) {
                $(this.graphics).addClass("visible-ac-canvas");
            }.bind(this)
        );
        var clearDiv = document.createElement("div");
        $(clearDiv).css("clear", "both"); // needed to make parent div resize properly
        this.outerDiv.appendChild(clearDiv);
        outDiv.appendChild(this.output);
        outDiv.appendChild(this.graphics);
        this.outerDiv.appendChild(outDiv);
        var lensDiv = document.createElement("div");
        lensDiv.id = `${this.divid}_codelens`;
        $(lensDiv).addClass("col-md-12");
        $(lensDiv).css("display", "none");
        this.codelens = lensDiv;
        this.outerDiv.appendChild(lensDiv);
        var coachDiv = document.createElement("div");
        $(coachDiv).addClass("col-md-12");
        $(coachDiv).css("display", "none");
        this.codecoach = coachDiv;
        this.outerDiv.appendChild(coachDiv);
        clearDiv = document.createElement("div");
        $(clearDiv).css("clear", "both"); // needed to make parent div resize properly
        this.outerDiv.appendChild(clearDiv);
    }
    disableSaveLoad() {
        $(this.saveButton).addClass("disabled");
        $(this.saveButton).attr("title", "Login to save your code");
        $(this.loadButton).addClass("disabled");
        $(this.loadButton).attr("title", "Login to load your code");
    }
    downloadFile(lang) {
        var fnb = this.divid;
        var d = new Date();
        var fileName =
            fnb +
            "_" +
            d
                .toJSON()
                .substring(0, 10) // reverse date format
                .split("-")
                .join("") +
            "." +
            languageExtensions[lang];
        var code = this.editor.getValue();
        if ("Blob" in window) {
            var textToWrite = code.replace(/\n/g, "\r\n");
            var textFileAsBlob = new Blob([textToWrite], {
                type: "text/plain",
            });
            if ("msSaveOrOpenBlob" in navigator) {
                navigator.msSaveOrOpenBlob(textFileAsBlob, fileName);
            } else {
                var downloadLink = document.createElement("a");
                downloadLink.download = fileName;
                downloadLink.innerHTML = "Download File";
                downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
                downloadLink.style.display = "none";
                document.body.appendChild(downloadLink);
                downloadLink.click();
            }
        } else {
            alert("Your browser does not support the HTML5 Blob.");
        }
    }
    loadEditor() {
        var loadEditor = function (data, status, whatever) {
            // function called when contents of database are returned successfully
            var res = eval(data)[0];
            if (res.source) {
                this.editor.setValue(res.source);
                setTimeout(
                    function () {
                        this.editor.refresh();
                    }.bind(this),
                    500
                );
                $(this.loadButton).tooltip({
                    placement: "bottom",
                    title: $.i18n("msg_activecode_loaded_code"),
                    trigger: "manual",
                });
            } else {
                $(this.loadButton).tooltip({
                    placement: "bottom",
                    title: $.i18n("msg_activecode_no_saved_code"),
                    trigger: "manual",
                });
            }
            $(this.loadButton).tooltip("show");
            setTimeout(
                function () {
                    $(this.loadButton).tooltip("destroy");
                }.bind(this),
                4000
            );
        }.bind(this);
        var data = {
            acid: this.divid,
        };
        if (this.sid !== undefined) {
            data["sid"] = this.sid;
        }
        // This function needs to be chainable for when we want to do things like run the activecode
        // immediately after loading the previous input (such as in a timed exam)
        var dfd = jQuery.Deferred();
        this.logBookEvent({
            event: "activecode",
            act: "load",
            div_id: this.divid,
        }); // Log the run event
        jQuery
            .get(eBookConfig.ajaxURL + "getprog", data, loadEditor)
            .done(function () {
                dfd.resolve();
            });
        return dfd;
    }
    createGradeSummary() {
        // get grade and comments for this assignment
        // get summary of all grades for this student
        // display grades in modal window
        var showGradeSummary = function (data, status, whatever) {
            var report = eval(data)[0];
            var body;
            // check for report['message']
            if (report) {
                if (report["version"] == 2) {
                    // new version; would be better to embed this in HTML for the activecode
                    body =
                        "<h4>Grade Report</h4>" +
                        "<p>This question: " +
                        report["grade"] +
                        " out of " +
                        report["max"] +
                        "</p>" +
                        "<p>" +
                        report["comment"] +
                        "</p>";
                } else {
                    body =
                        "<h4>Grade Report</h4>" +
                        "<p>This assignment: " +
                        report["grade"] +
                        "</p>" +
                        "<p>" +
                        report["comment"] +
                        "</p>" +
                        "<p>Number of graded assignments: " +
                        report["count"] +
                        "</p>" +
                        "<p>Average score: " +
                        report["avg"] +
                        "</p>";
                }
            } else {
                body =
                    "<h4>The server did not return any grade information</h4>";
            }
            var html = `<div class="modal fade">
                  <div class="modal-dialog compare-modal">
                    <div class="modal-content">
                      <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
                        <h4 class="modal-title">Assignment Feedback</h4>
                      </div>
                      <div class="modal-body">
                        ${body}
                      </div>
                    </div>
                  </div>
                </div>`;
            var el = $(html);
            el.modal();
        };
        var data = {
            div_id: this.divid,
        };
        jQuery.get(
            eBookConfig.ajaxURL + "getassignmentgrade",
            data,
            showGradeSummary
        );
    }
    hideCodelens(button, div_id) {
        this.codelens.style.display = "none";
    }
    showCodelens() {
        if (this.codelens.style.display == "none") {
            this.codelens.style.display = "block";
            this.clButton.innerText = $.i18n("msg_activecode_hide_codelens");
        } else {
            this.codelens.style.display = "none";
            this.clButton.innerText = $.i18n("msg_activecode_show_in_codelens");
            return;
        }
        var cl = this.codelens.firstChild;
        if (cl) {
            this.codelens.removeChild(cl);
        }
        var code = this.buildProg(false);
        var myVars = {};
        myVars.code = code;
        myVars.origin = "opt-frontend.js";
        myVars.cumulative = false;
        myVars.heapPrimitives = false;
        myVars.drawParentPointers = false;
        myVars.textReferences = false;
        myVars.showOnlyOutputs = false;
        myVars.rawInputLstJSON = JSON.stringify([]);
        if (this.language == "python") {
            if (this.python3) {
                myVars.py = 3;
            } else {
                myVars.py = 2;
            }
        } else if (this.langauge == "javascript") {
            myVars.py = "js";
        } else {
            myVars.py = this.language;
        }
        myVars.curInstr = 0;
        myVars.codeDivWidth = 350;
        myVars.codeDivHeight = 400;
        var srcURL = "https://pythontutor.com/iframe-embed.html";
        var srcVars = $.param(myVars);
        var embedUrlStr = `${srcURL}#${srcVars}`;
        var myIframe = document.createElement("iframe");
        myIframe.setAttribute("id", this.divid + "_codelens");
        myIframe.setAttribute("width", "800");
        myIframe.setAttribute("height", "500");
        myIframe.setAttribute("style", "display:block");
        myIframe.style.background = "#fff";
        //myIframe.setAttribute("src",srcURL)
        myIframe.src = embedUrlStr;
        this.codelens.appendChild(myIframe);
        this.logBookEvent({
            event: "codelens",
            act: "view",
            div_id: this.divid,
        });
    }
    // <iframe id="%(divid)s_codelens" width="800" height="500" style="display:block"src="#">
    // </iframe>
    showCodeCoach() {
        var myIframe;
        var srcURL;
        var cl;
        var div_id = this.divid;
        if (this.codecoach === null) {
            this.codecoach = document.createElement("div");
            this.codecoach.style.display = "block";
        }
        cl = this.codecoach.firstChild;
        if (cl) {
            this.codecoach.removeChild(cl);
        }
        srcURL = eBookConfig.app + "/admin/diffviewer?divid=" + div_id;
        myIframe = document.createElement("iframe");
        myIframe.setAttribute("id", div_id + "_coach");
        myIframe.setAttribute("width", "800px");
        myIframe.setAttribute("height", "500px");
        myIframe.setAttribute("style", "display:block");
        myIframe.style.background = "#fff";
        myIframe.style.width = "100%";
        myIframe.src = srcURL;
        this.codecoach.appendChild(myIframe);
        $(this.codecoach).show();
        this.logBookEvent({
            event: "coach",
            act: "view",
            div_id: this.divid,
        });
    }
    showTIE() {
        var tieDiv = document.createElement("div");
        $(this.tieButt).attr("disabled", "disabled");
        $(tieDiv).addClass("tie-container");
        $(tieDiv).data("tie-id", this.divid);
        var ifm = document.createElement("iframe");
        $(ifm).addClass("tie-frame");
        ifm.src = `https://tech-interview-exercises.appspot.com/client/question.html?qid=${this.tie}`;
        var setIframeDimensions = function () {
            $(".tie-container").css(
                "width",
                $(".tie-container").parent().width()
            );
            //    $('.tie-frame').css('width', $('.tie-frame').parent().width() - 120);
        };
        ifm.onload = setIframeDimensions;
        $(function () {
            $(window).resize(setIframeDimensions);
        });
        window.addEventListener(
            "message",
            function (evt) {
                if (
                    evt.origin != "https://tech-interview-exercises.appspot.com"
                ) {
                    return;
                }
                // Handle the event accordingly.
                // evt.data contains the code
                this.logRunEvent({
                    div_id: this.divid,
                    code: JSON.parse(evt.data),
                    lang: this.language,
                    errinfo: "TIEresult",
                    to_save: true,
                    prefix: this.pretext,
                    suffix: this.suffix,
                });
            }.bind(this),
            false
        );
        this.logBookEvent({
            event: "tie",
            act: "open",
            div_id: this.divid,
        });
        tieDiv.appendChild(ifm);
        this.outerDiv.appendChild(tieDiv);
    }
    toggleEditorVisibility() {}
    addErrorMessage(err) {
        // Add the error message
        var errHead = $("<h3>").html("Error");
        this.eContainer = this.outerDiv.appendChild(
            document.createElement("div")
        );
        this.eContainer.className = "error alert alert-danger";
        this.eContainer.id = this.divid + "_errinfo";
        this.eContainer.appendChild(errHead[0]);
        var errText = this.eContainer.appendChild(
            document.createElement("pre")
        );
        // But, adjust the line numbers.  If the line number is <= pretextLines then it is in included code
        // if it is greater than the number of included lines but less than the pretext + current editor then it is in the student code.
        // adjust the line number we display by eliminating the pre-included code.
        if (err.traceback.length >= 1) {
            var errorLine = err.traceback[0].lineno;
            if (errorLine <= this.pretextLines) {
                errText.innerHTML =
                    "An error occurred in the hidden, included code. Sorry we can't give you a more helpful error message";
                return;
            } else if (errorLine > this.progLines + this.pretextLines) {
                errText.innerHTML =
                    "An error occurred after the end of your code. One possible reason is that you have an unclosed parenthesis or string. Another possibility is that there is an error in the hidden test code.";
                return;
            } else {
                if (this.pretextLines > 0) {
                    err.traceback[0].lineno =
                        err.traceback[0].lineno - this.pretextLines + 1;
                }
            }
        }
        var errString = err.toString();
        var to = errString.indexOf(":");
        var errName = errString.substring(0, to);
        errText.innerHTML = errString;
        $(this.eContainer).append("<h3>Description</h3>");
        var errDesc = this.eContainer.appendChild(document.createElement("p"));
        errDesc.innerHTML = errorText[errName];
        $(this.eContainer).append("<h3>To Fix</h3>");
        var errFix = this.eContainer.appendChild(document.createElement("p"));
        errFix.innerHTML = errorText[errName + "Fix"];
        var moreInfo = "../ErrorHelp/" + errName.toLowerCase() + ".html";
        //console.log("Runtime Error: " + err.toString());
    }
    setTimeLimit(timer) {
        var timelimit = this.timelimit;
        if (timer !== undefined) {
            timelimit = timer;
        }
        // set execLimit in milliseconds  -- for student projects set this to
        // 25 seconds -- just less than Chrome's own timer.
        if (
            this.code.indexOf("ontimer") > -1 ||
            this.code.indexOf("onclick") > -1 ||
            this.code.indexOf("onkey") > -1 ||
            this.code.indexOf("setDelay") > -1
        ) {
            Sk.execLimit = null;
        } else {
            if (timelimit === "off") {
                Sk.execLimit = null;
            } else if (timelimit) {
                Sk.execLimit = timelimit;
            } else {
                Sk.execLimit = 25000;
            }
        }
    }
    builtinRead(x) {
        if (
            Sk.builtinFiles === undefined ||
            Sk.builtinFiles["files"][x] === undefined
        )
            throw $.i18n("msg_activecode_file_not_found", x);
        return Sk.builtinFiles["files"][x];
    }
    fileReader(divid) {
        let elem = document.getElementById(divid);
        let data = "";
        let result = "";
        if (elem == null && Sk.builtinFiles.files.hasOwnProperty(divid)) {
            return Sk.builtinFiles["files"][divid];
        } else {
            // try remote file unless it ends with .js or .py -- otherwise we'll ask the server for all
            // kinds of modules that we are trying to import
            if (!(divid.endsWith(".js") || divid.endsWith(".py"))) {
                $.ajax({
                    async: false,
                    url: `/runestone/ajax/get_datafile?course_id=${eBookConfig.course}&acid=${divid}`,
                    success: function (data) {
                        result = JSON.parse(data).data;
                    },
                    error: function (err) {
                        result = null;
                    },
                });
                if (result) {
                    return result;
                }
            }
        }
        if (elem == null && result === null) {
            throw new Sk.builtin.IOError(
                $.i18n("msg_activecode_no_file_or_dir", divid)
            );
        } else {
            if (elem.nodeName.toLowerCase() == "textarea") {
                data = elem.value;
            } else {
                data = elem.textContent;
            }
        }
        return data;
    }
    outputfun(text) {
        // bnm python 3
        var pyStr = function (x) {
            if (x instanceof Array) {
                return "[" + x.join(", ") + "]";
            } else {
                return x;
            }
        };
        var x = text;
        if (!this.python3) {
            if (x.charAt(0) == "(") {
                x = x.slice(1, -1);
                x = "[" + x + "]";
                try {
                    var xl = eval(x);
                    xl = xl.map(pyStr);
                    x = xl.join(" ");
                } catch (err) {}
            }
        }
        $(this.output).css("visibility", "visible");
        text = x;
        text = text
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\n/g, "<br/>");
        return Promise.resolve().then(
            function () {
                setTimeout(
                    function () {
                        $(this.output).append(text);
                    }.bind(this),
                    0
                );
            }.bind(this)
        );
    }

    filewriter(fobj, bytes) {
        let filecomponent = document.getElementById(fobj.name);
        if (!filecomponent) {
            let container = document.createElement("div");
            $(container).addClass("runestone");
            let tab = document.createElement("div");
            $(tab).addClass("datafile_caption");
            tab.innerHTML = `Data file: <code>${fobj.name}</code>`;
            filecomponent = document.createElement("textarea");
            filecomponent.rows = 10;
            filecomponent.cols = 50;
            filecomponent.id = fobj.name;
            $(filecomponent).css("margin-bottom", "5px");
            $(filecomponent).addClass("ac_output");
            container.appendChild(tab);
            container.appendChild(filecomponent);
            this.outerDiv.appendChild(container);
        } else {
            if (fobj.pos$ == 0) {
                $(filecomponent).val("");
            }
        }
        let current = $(filecomponent).val();
        current = current + bytes.v;
        $(filecomponent).val(current);
        $(filecomponent).css("display", "block");
        fobj.pos$ = current.length;
        return current.length;
    }

    getIncludedCode(divid) {
        var result, wresult;
        if (window.edList[divid]) {
            return window.edList[divid].editor.getValue();
        } else {
            wresult = $.ajax({
                async: false,
                url: `/runestone/ajax/get_datafile?course_id=${eBookConfig.course}&acid=${divid}`,
                success: function (data) {
                    result = JSON.parse(data).data;
                },
                error: function (err) {
                    result = null;
                },
            });
            return result;
        }
    }

    buildProg(useSuffix) {
        // assemble code from prefix, suffix, and editor for running.
        var pretext;
        var prog = this.editor.getValue() + "\n";
        this.pretext = "";
        this.pretextLines = 0;
        this.progLines = prog.match(/\n/g).length + 1;
        if (this.includes !== undefined) {
            // iterate over the includes, in-order prepending to prog
            pretext = "";
            for (var x = 0; x < this.includes.length; x++) {
                let iCode = this.getIncludedCode(this.includes[x]);
                pretext = pretext + iCode + "\n";
            }
            this.pretext = pretext;
            if (this.pretext) {
                this.pretextLines = (this.pretext.match(/\n/g) || "").length;
            }
            prog = pretext + prog;
        }
        if (useSuffix && this.suffix) {
            prog = prog + this.suffix;
        }
        return prog;
    }
    manage_scrubber(scrubber_dfd, history_dfd, saveCode) {
        if (this.historyScrubber === null && !this.autorun) {
            scrubber_dfd = this.addHistoryScrubber();
        } else {
            scrubber_dfd = jQuery.Deferred();
            scrubber_dfd.resolve();
        }
        history_dfd = jQuery.Deferred();
        scrubber_dfd
            .done(
                function () {
                    if (
                        this.historyScrubber &&
                        this.history[$(this.historyScrubber).slider("value")] !=
                            this.editor.getValue()
                    ) {
                        saveCode = "True";
                        this.history.push(this.editor.getValue());
                        this.timestamps.push(new Date().toLocaleString());
                        $(this.historyScrubber).slider(
                            "option",
                            "max",
                            this.history.length - 1
                        );
                        $(this.historyScrubber).slider(
                            "option",
                            "value",
                            this.history.length - 1
                        );
                        this.slideit();
                    } else {
                        saveCode = "False";
                    }
                    if (this.historyScrubber == null) {
                        saveCode = "False";
                    }
                    history_dfd.resolve();
                }.bind(this)
            )
            .fail(function () {
                console.log(
                    "Scrubber deferred failed - this should not happen"
                );
                history_dfd.resolve();
            });
        return {
            history_dfd: history_dfd,
            saveCode: saveCode,
        };
    }
    runProg() {
        var prog = this.buildProg(true);
        var saveCode = "True";
        var scrubber_dfd, history_dfd, skulpt_run_dfd;
        $(this.output).text("");
        $(this.eContainer).remove();
        if (this.codelens) {
            this.codelens.style.display = "none";
        }
        if (this.clButton) {
            this.clButton.innerText = $.i18n("msg_activecode_show_in_codelens");
        }
        Sk.configure({
            output: this.outputfun.bind(this),
            read: this.fileReader,
            filewrite: this.filewriter.bind(this),
            __future__: Sk.python3,
            nonreadopen: true,
            //        python3: this.python3,
            imageProxy: "http://image.runestone.academy:8080/320x",
            inputfunTakesPrompt: true,
            jsonpSites: ["https://itunes.apple.com"],
        });
        Sk.divid = this.divid;
        if (this.graderactive && this.containerDiv.closest(".loading")) {
            Sk.gradeContainer = this.containerDiv.closest(".loading").id;
        } else {
            Sk.gradeContainer = this.divid;
        }
        this.setTimeLimit();
        (Sk.TurtleGraphics || (Sk.TurtleGraphics = {})).target = this.graphics;
        Sk.canvas = this.graphics.id; //todo: get rid of this here and in image
        $(this.runButton).attr("disabled", "disabled");
        $(this.historyScrubber).off("slidechange");
        $(this.historyScrubber).slider("disable");
        $(this.outDiv).show({
            duration: 700,
            queue: false,
        });
        var __ret = this.manage_scrubber(scrubber_dfd, history_dfd, saveCode);
        history_dfd = __ret.history_dfd;
        saveCode = __ret.saveCode;
        skulpt_run_dfd = Sk.misceval.asyncToPromise(function () {
            return Sk.importMainWithBody("<stdin>", false, prog, true);
        });
        // Make sure that the history scrubber is fully initialized AND the code has been run
        // before we start logging stuff.
        var self = this;
        Promise.all([skulpt_run_dfd, history_dfd]).then(
            function (mod) {
                $(this.runButton).removeAttr("disabled");
                if (this.slideit) {
                    $(this.historyScrubber).on(
                        "slidechange",
                        this.slideit.bind(this)
                    );
                }
                $(this.historyScrubber).slider("enable");
                this.logRunEvent({
                    div_id: this.divid,
                    code: this.editor.getValue(),
                    lang: this.language,
                    errinfo: "success",
                    to_save: saveCode,
                    prefix: this.pretext,
                    suffix: this.suffix,
                    partner: this.partner,
                }); // Log the run event
            }.bind(this),
            function (err) {
                history_dfd.done(function () {
                    $(self.runButton).removeAttr("disabled");
                    $(self.historyScrubber).on(
                        "slidechange",
                        self.slideit.bind(self)
                    );
                    $(self.historyScrubber).slider("enable");
                    self.logRunEvent({
                        div_id: self.divid,
                        code: self.editor.getValue(),
                        lang: self.langauge,
                        errinfo: err.toString(),
                        to_save: saveCode,
                        prefix: self.pretext,
                        suffix: self.suffix,
                        partner: self.partner,
                    }); // Log the run event
                    self.addErrorMessage(err);
                });
            }
        );
        if (typeof window.allVisualizers != "undefined") {
            $.each(window.allVisualizers, function (i, e) {
                e.redrawConnectors();
            });
        }
    }
}

var languageExtensions = {
    python: "py",
    html: "html",
    javascript: "js",
    java: "java",
    python2: "py",
    python3: "py",
    cpp: "cpp",
    c: "c",
    sql: "sql",
};

var errorText = {};

errorText.ParseError = $.i18n("msg_sctivecode_parse_error");
errorText.ParseErrorFix = $.i18n("msg_sctivecode_parse_error_fix");
errorText.TypeError = $.i18n("msg_activecode_type_error");
errorText.TypeErrorFix = $.i18n("msg_activecode_type_error_fix");
errorText.NameError = $.i18n("msg_activecode_name_error");
errorText.NameErrorFix = $.i18n("msg_activecode_name_error_fix");
errorText.ValueError = $.i18n("msg_activecode_value_error");
errorText.ValueErrorFix = $.i18n("msg_activecode_value_error_fix");
errorText.AttributeError = $.i18n("msg_activecode_attribute_error");
errorText.AttributeErrorFix = $.i18n("msg_activecode_attribute_error_fix");
errorText.TokenError = $.i18n("msg_activecode_token_error");
errorText.TokenErrorFix = $.i18n("msg_activecode_token_error_fix");
errorText.TimeLimitError = $.i18n("msg_activecode_time_limit_error");
errorText.TimeLimitErrorFix = $.i18n("msg_activecode_time_limit_error_fix");
errorText.Error = $.i18n("msg_activecode_general_error");
errorText.ErrorFix = $.i18n("msg_activecode_general_error_fix");
errorText.SyntaxError = $.i18n("msg_activecode_syntax_error");
errorText.SyntaxErrorFix = $.i18n("msg_activecode_syntax_error_fix");
errorText.IndexError = $.i18n("msg_activecode_index_error");
errorText.IndexErrorFix = $.i18n("msg_activecode_index_error_fix");
errorText.URIError = $.i18n("msg_activecode_uri_error");
errorText.URIErrorFix = $.i18n("msg_activecode_uri_error_fix");
errorText.ImportError = $.i18n("msg_activecode_import_error");
errorText.ImportErrorFix = $.i18n("msg_activecode_import_error_fix");
errorText.ReferenceError = $.i18n("msg_activecode_reference_error");
errorText.ReferenceErrorFix = $.i18n("msg_activecode_reference_error_fix");
errorText.ZeroDivisionError = $.i18n("msg_activecode_zero_division_error");
errorText.ZeroDivisionErrorFix = $.i18n(
    "msg_activecode_zero_division_error_fix"
);
errorText.RangeError = $.i18n("msg_activecode_range_error");
errorText.RangeErrorFix = $.i18n("msg_activecode_range_error_fix");
errorText.InternalError = $.i18n("msg_activecode_internal_error");
errorText.InternalErrorFix = $.i18n("msg_activecode_internal_error_fix");
errorText.IndentationError = $.i18n("msg_activecode_indentation_error");
errorText.IndentationErrorFix = $.i18n("msg_activecode_indentation_error_fix");
errorText.NotImplementedError = $.i18n("msg_activecode_not_implemented_error");
errorText.NotImplementedErrorFix = $.i18n(
    "msg_activecode_not_implemented_error_fix"
);
errorText.KeyError = $.i18n("msg_activecode_key_error");
errorText.KeyErrorFix = $.i18n("msg_activecode_key_error_fix");
errorText.AssertionError = $.i18n("msg_activecode_assertion_error");
errorText.AssertionErrorFix = $.i18n("msg_activecode_assertion_error_fix");

String.prototype.replaceAll = function (target, replacement) {
    return this.split(target).join(replacement);
};
