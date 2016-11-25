sensorsdata.IndexPage = function() {
    this.sideBar_ = $("#sa_sidebar");
    this.saMainDom_ = $("#sa-main");
    this.loadingBar_ = $("#sa-loading-bar");
    this.headNavDom_ = $("nav.sa-head");
    this.urlRememberObj = {};
    this.events_ = [];
    this.bookmarkList_ = null ;
    this.licenseFreshIntervalId = -1;
    this.licenseItems_ = [];
    this.aboutModal_ = null ;
    this.dashboardTemplateList_ = [];
    this.init()
}
;
sensorsdata.IndexPage.prototype.init = function() {
    var b = sensorsdata.getLocationSearch().project || "";
    var e = null ;
    var c = JSON.parse(localStorage.getItem(sensorsdata.CONSTSET.projectKey)) || [];
    if (c.length > 0) {
        e = c.filter(function(f) {
            return f.project === b
        })[0];
        if (!e && !b) {
            b = c[0].project;
            e = c[0]
        }
    }
    sensorsdata.cache.project = {
        name: b,
        cname: ""
    };
    if (e) {
        sensorsdata.authority = new sensorsdata.Authority({
            id: e.userId,
            name: e.userName,
            role: e.role
        })
    } else {
        sensorsdata.authority = new sensorsdata.Authority({
            name: $.cookie(sensorsdata.cookie.USERNAME),
            role: $.cookie(sensorsdata.cookie.ROLE),
            id: $.cookie(sensorsdata.cookie.USERID)
        })
    }
    if (false === this.checkLoginStatus()) {
        return
    }
    if (b) {
        this.sideBar_.find("a#hue-query").attr("href", "/query/?project=" + b)
    }
    var a = window.localStorage.getItem(sensorsdata.CONSTSET.urlRememberKey);
    if (a) {
        this.urlRememberObj = JSON.parse(a) || {}
    }
    sensorsdata.dashboardList = new sensorsdata.DashboardList();
    this.setDefaultUrl_();
    this.initEvent_();
    this.initPage();
    this.bookmarkList_ = new sensorsdata.BookMarkList(sensorsdata.bind(this.initPage, this));
    if (this.sideBar_.width() < 50) {
        this.sideBar_.find("a[title]").tooltip({
            container: "body",
            placement: "right"
        })
    }
    var d = 60 * 60 * 1000;
    this.licenseFreshIntervalId = window.setInterval(sensorsdata.bind(function() {
        this.getConfig_(sensorsdata.bind(this.checkLicense_, this))
    }, this), d);
    this.getConfig_(sensorsdata.bind(this.checkLicense_, this));
    this.getProject_(b)
}
;
sensorsdata.IndexPage.prototype.initEvent_ = function() {
    this.headNavDom_.find("#signout").bind("click", sensorsdata.bind(this.signoutClick_, this));
    this.sideBar_.on("click", ".sidebar-links li[data-nav]", sensorsdata.bind(this.sidebarLinksClick_, this));
    var a = this;
    $("#events_management_btn").on("click", function() {
        if ($("#sidebar-toggle").is(":visible")) {
            a.sideBar_.removeClass("shown")
        }
        a.sideBar_.find(".sidebar-section li.active").removeClass("active");
        $("#sidebar-bottom a.active").removeClass("active");
        $(this).addClass("active");
        if (window.pageName !== "/events/") {
            a.initPage("/events/#type=meta")
        }
    });
    $("#vtrack_manager_btn").on("click", function() {
        if ($("#sidebar-toggle").is(":visible")) {
            a.sideBar_.removeClass("shown")
        }
        a.sideBar_.find(".sidebar-section li.active").removeClass("active");
        $("#sidebar-bottom a.active").removeClass("active");
        $(this).addClass("active");
        if (window.pageName !== "/vtrack/") {
            a.initPage("/vtrack/")
        }
    });
    $("#bookmark_list_btn").on("click", function() {
        a.sideBar_.find(".sidebar-section li.active").removeClass("active");
        $("#sidebar-bottom a.active").removeClass("active");
        $(this).addClass("active")
    });
    $("#sidebar-toggle").on("click", function() {
        $("#sa_dashboard_list_out").tooltip("destroy");
        a.sideBar_.find("a[title]").tooltip("destroy");
        if (a.sideBar_.hasClass("shown")) {
            a.sideBar_.removeClass("shown")
        } else {
            a.sideBar_.addClass("shown")
        }
    });
    $("#hopscotch_guide_btn").on("click", function() {
        sensorsdata.functionGuide.show(true)
    });
    $("#user-dropdown li a").on("click", function() {
        if ($(this).attr("data-nav")) {
            a.initPage($(this).attr("data-nav"));
            $(".sa-sidebar li.active").removeClass("active");
            $(".sa-sidebar a.active").removeClass("active")
        }
        if ($(this).attr("id") === "sa_head_changePassword") {
            a.popChangePass_()
        }
        if ($(this).attr("data-method") === "sa-share") {
            var b = {
                utm_campaign: sensorsdata.cache.config.license.customer_id,
                utm_medium: sensorsdata.cache.project.name,
                utm_source: sensorsdata.authority.userName
            };
            $(this).attr("target", "_blank");
            $(this).attr("href", "https://www.sensorsdata.cn/share/share.html?" + $.param(b))
        }
    });
    $("#sa_head_about").on("click", function() {
        a.popAbout_()
    });
    this.urlRememberObj.lastPathname = window.location.pathname;
    window.localStorage.setItem(sensorsdata.CONSTSET.urlRememberKey, JSON.stringify(this.urlRememberObj));
    $("#btn-viewport-warning-close").on("click", function() {
        $(this).parents("div.viewport-warning:first").hide()
    });
    $(window).on("hashchange", sensorsdata.bind(function() {
        this.rememberUrl_()
    }, this));
    $(window).on("popstate", sensorsdata.bind(function() {
        if (window.pageName !== window.location.pathname) {
            this.initPage()
        } else {
            if (window.page && $.isFunction(window.page.reload)) {
                window.page.reload()
            }
        }
    }, this));
    $(window).on("unload", sensorsdata.bind(function() {
        this.rememberUrl_();
        sensorsdata.clearReportAjax();
        window.clearInterval(this.licenseFreshIntervalId)
    }, this))
}
;
sensorsdata.IndexPage.prototype.popChangePass_ = function() {
    var g = $("#changePassword");
    var e = g.find("#changeOk");
    var c = g.find(".close");
    g.modal("show");
    var d = $("#newPass")
      , h = $("#renewPass")
      , f = $("#oldPass");
    var b = function() {
        f.val("");
        d.val("");
        h.val("")
    };
    var a = function(j) {
        var i = sensorsdata.form.checkChildren(j, true, 0, {
            container: g
        });
        if (!i) {
            return false
        } else {
            var k = $.trim(h.val());
            var l = $.trim(d.val());
            if (k !== l) {
                sensorsdata.form.addError(d, d.attr("data-error-text-re"), false, {
                    container: g
                });
                sensorsdata.form.addError(h, h.attr("data-error-text-re"), true, {
                    container: g
                });
                return false
            } else {
                sensorsdata.form.removeError(j);
                return true
            }
        }
    };
    d.on("focusout", function() {
        sensorsdata.form.check($(this), true, 1, {
            container: g
        })
    });
    h.on("focusout", function() {
        sensorsdata.form.check($(this), true, 1, {
            container: g
        })
    });
    c.on("click", function() {
        b();
        sensorsdata.form.removeError(f);
        sensorsdata.form.removeError(d);
        sensorsdata.form.removeError(h)
    });
    e.click(function() {
        if (a(g) === false) {
            return
        }
        var i = {
            password: $.trim(d.val()),
            old_password: $.trim(f.val())
        };
        sensorsdata.ajax({
            type: "post",
            url: "account/password",
            data: JSON.stringify(i),
            customErrorStatusCode: 403,
            error: function(j) {
                b();
                if (j.status === 403) {
                    sensorsdata.form.addError(f, f.attr("data-error-text"), true, {
                        container: g
                    })
                }
                if (j.status === 400) {
                    sensorsdata.form.addError(f, f.attr("data-error-text-test1"), true, {
                        container: g
                    })
                }
            },
            success: function() {
                sensorsdata.form.removeError(f);
                g.modal("hide");
                b();
                var j = sensorsdata.buildLoginUrl();
                var k = '修改密码成功，请<a href="' + j + '">重新登录</a>';
                window.setTimeout(function() {
                    window.location.href = j
                }, 3000);
                sensorsdata.info.show(k)
            }
        })
    })
}
;
sensorsdata.IndexPage.prototype.popAbout_ = function() {
    var b = function(h) {
        var k = Mustache.render($("#tpl-common-modal").html(), {
            title: "正在重置“" + h + "”，请勿关闭网页",
            defaultCoseHide: true,
            closeButtomText: "关闭"
        });
        var j = $(k);
        j.find(".modal-dialog").addClass("modal-lg");
        j.find(".modal-body").html($("#tpl-reset-project-progress").html());
        var f = j.find(".modal-body .progress-bar");
        var m = 40;
        var l = 0;
        var g = function() {
            var n = 0;
            l = setInterval(function() {
                if (n > 40) {
                    clearInterval(l);
                    return
                }
                var o = Math.round(n / m * 100) + "%";
                f.css("width", o).text(o);
                n += 0.5
            }, 500)
        };
        j.modal({
            backdrop: "static",
            keyboard: false,
            show: true
        });
        g();
        $(window).bind("beforeunload.reset-project", function() {
            return confirm("确定关闭浏览器吗？重置会发生意想不到的结果。")
        });
        var i = sensorsdata.cache.project.name;
        sensorsdata.ajax({
            method: "PUT",
            url: "project/" + (i || "default"),
            customErrorStatusCode: 503,
            timeout: 40000,
            complete: function() {
                $(window).unbind("beforeunload.reset-project");
                clearInterval(l);
                f.css("width", "100%").text("100%")
            },
            error: function(o) {
                var n = parseInt(o.status, 10);
                j.find(".alert").toggle(n === 503);
                j.find("#btn-cancel").show()
            },
            success: sensorsdata.bind(function() {
                window.location.href = sensorsdata.buildLoginUrl(false)
            }, this)
        })
    };
    var d = Mustache.render($("#tpl-common-modal").html(), {
        title: "关于",
        closeButtomDisplay: true,
        closeButtomText: "关闭"
    });
    var c = $(d);
    var a = Mustache.render($("#tpl-sa-about").html(), {
        version: sensorsdata.CONSTSET.version,
        project: sensorsdata.cache.project.cname || sensorsdata.cache.project.name,
        licenseItems: this.licenseItems_,
        denyReset: sensorsdata.authority.userName !== "admin"
    });
    var e = this;
    c.find(".modal-body").html(a).find("#btn-reset-project").unbind("click").bind("click", function() {
        e.aboutModal_.modal("hide");
        var h = Mustache.render($("#tpl-common-modal").html(), {
            title: "信息确认",
            closeButtomDisplay: true,
            closeButtomText: "取消",
            okButtomDisplay: true,
            okButtomText: "确定"
        });
        var g = $(h);
        g.find(".modal-body").html($("#tpl-reset-project-confirm").html());
        var f = g.find("#btn-ok");
        f.toggleClass("disabled", true);
        g.find("#confirm-checkbox").unbind("change").bind("change", function() {
            f.toggleClass("disabled", !$(this).prop("checked"))
        });
        f.unbind("click").bind("click", function() {
            if (!sensorsdata.form.checkChildren(g, true, 1, {
                container: g
            })) {
                return
            }
            var l = g.find("#project-name");
            var j = $.trim(l.val());
            var k = $.trim(g.find("#reset-reason").val());
            if ((sensorsdata.cache.project.name && j !== sensorsdata.cache.project.cname) || (!sensorsdata.cache.project.name && j !== "默认项目")) {
                sensorsdata.form.addError(l, "项目名称不正确", true, {
                    container: g
                });
                return
            }
            var i = new Image();
            i.src = "/err.gif?method=reset-project&project=" + encodeURIComponent(j) + "&reason=" + encodeURIComponent(k);
            g.modal("hide");
            b(j)
        });
        g.modal("show")
    });
    if (this.aboutModal_) {
        this.aboutModal_.modal("hide")
    }
    this.aboutModal_ = c.modal("show")
}
;
sensorsdata.IndexPage.prototype.rememberUrl_ = function() {
    var a = window.location.pathname;
    var c = window.location.hash;
    if (c.indexOf(sensorsdata.CONSTSET.bookmarkId) !== -1) {
        return
    }
    if (sensorsdata.cache.errors[a + c]) {
        delete this.urlRememberObj[a]
    } else {
        this.urlRememberObj[a] = c;
        this.urlRememberObj.lastPathname = a
    }
    try {
        window.localStorage.setItem(sensorsdata.CONSTSET.urlRememberKey, JSON.stringify(this.urlRememberObj))
    } catch (b) {
        console.info(b)
    }
}
;
sensorsdata.IndexPage.prototype.checkLoginStatus = function() {
    var b = window.localStorage.getItem(sensorsdata.CONSTSET.eventPermissionKey);
    if (!$.isEmptyObject(b)) {
        sensorsdata.cache.eventPermission = JSON.parse(b)
    }
    new sensorsdata.DemoDataImport();
    if (sensorsdata.authority.userName && $.cookie(sensorsdata.cookie.TOKEN)) {
        this.headNavDom_.find("#userName").text(sensorsdata.authority.userName);
        var a = $("[data-authorization]");
        a.filter('[data-authorization="normal"]').show();
        a.filter('[data-authorization!="normal"]').toggle(!sensorsdata.authority.isNormal);
        a.filter('[data-authorization="admin"]').toggle(sensorsdata.authority.isAdmin);
        return true
    }
    window.location.href = sensorsdata.buildLoginUrl();
    return false
}
;
sensorsdata.IndexPage.prototype.sidebarLinksClick_ = function(a) {
    if ($(a.target).closest("#sa_dashboard_list_out").size() === 0) {
        $("#sa_dashboard_list_action_hide").trigger("click")
    }
    if ($("#sidebar-toggle").is(":visible")) {
        this.sideBar_.removeClass("shown")
    }
    var b = $(a.target || a.srcElement);
    var c = b.attr("data-nav");
    if (!c) {
        b = b.parents("li:first");
        c = b.attr("data-nav")
    }
    if (!this.sideBar_.find(".sidebar-links li[data-nav].active").is(b)) {
        $("#sidebar-bottom a.active").removeClass("active");
        this.initPage(b.find("a").attr("data-href"))
    }
}
;
sensorsdata.IndexPage.prototype.signoutClick_ = function() {
    sensorsdata.ajax({
        method: "POST",
        url: "auth/logout",
        success: sensorsdata.bind(function() {
            window.location.href = sensorsdata.buildLoginUrl(false)
        }, this)
    })
}
;
sensorsdata.IndexPage.prototype.refresh = function() {
    var a = window.location.pathname + window.location.search + window.location.hash;
    this.initPage(a)
}
;
sensorsdata.IndexPage.prototype.initPage = function(a) {
    var d = window.location.pathname;
    var c = sensorsdata.cache.project.name ? "?project=" + (sensorsdata.cache.project.name) : "";
    var f = window.location.hash;
    var g = [];
    if (a) {
        g = (/(\/.+\/)(#.+)?/).exec(a);
        if ($.isArray(g) && g.length > 1 && g[1]) {
            d = g[1];
            f = g[2] || this.urlRememberObj[d] || ""
        }
    }
    if (!d) {
        this.setDefaultUrl_();
        d = window.location.pathname;
        f = window.location.hash
    }
    if (d !== "/dashboard/") {
        g = (/^\/(\S+?)\//).exec(d);
        if ($.isArray(g) && g.length > 1) {
            this.sideBar_.find("[data-nav].active").removeClass("active");
            this.sideBar_.find('[data-nav="' + g[1] + '"]').addClass("active")
        }
    }
    if (location.pathname !== d || location.search !== c || location.hash !== f) {
        this.rememberUrl_();
        var b = d + c + f;
        if (!this.isDashboardNoHash) {
            window.history.pushState(b, "", b)
        } else {
            window.history.replaceState(b, "", b)
        }
    }
    this.isDashboardNoHash = false;
    sensorsdata.clearReportAjax();
    var e = this;
    sensorsdata.ajax({
        url: "events/all",
        success: sensorsdata.bind(function(i) {
            if (!$.isArray(i)) {
                sensorsdata.error.show("数据格式错误，请联系技术人员");
                console.info(i);
                throw "ajax events/all return error json."
            }
            var k = Object.keys(sensorsdata.CONSTSET.urlNoEvents);
            var h = sensorsdata.CONSTSET.urlNoEvents[d];
            var j = k.indexOf(d) >= 0 && (!h || ("#" + h) === f);
            if (i.length > 0) {
                sensorsdata.cache.events = i;
                this.events_ = $.extend(true, [], sensorsdata.cache.events)
            }
            if (i.length === 0 && j === false) {
                d = "/import/"
            }
        }, this)
    }).then(function() {
        return e.getConfig_()
    }).then(sensorsdata.bind(function() {
        var j = $.Deferred();
        if (!$.isArray(this.events_) || this.events_.length === 0) {
            j.reject();
            return j
        }
        var i = sensorsdata.unparam(window.location.hash);
        var h = i[sensorsdata.CONSTSET.bookmarkId];
        if (!$.isNumeric(h)) {
            j.resolve();
            return j
        }
        return sensorsdata.ajax({
            customErrorStatusCode: 410,
            url: "bookmarks/bookmark/" + h,
            error: sensorsdata.bind(function() {
                var m = sensorsdata.unparam(window.location.hash);
                delete m[sensorsdata.CONSTSET.bookmarkId];
                var l = "#" + $.param(m);
                var k = d + (l ? l : "");
                window.history.pushState(k, "", k)
            }, this)
        })
    }, this)).always(sensorsdata.bind(function() {
        this.renderPage_(d);
        this.rememberUrl_()
    }, this))
}
;
sensorsdata.IndexPage.prototype.formatPageName_ = function(a) {
    var b = a.split("/").filter(function(c) {
        return c !== ""
    });
    return "/" + b[b.length - 1] + "/"
}
;
sensorsdata.IndexPage.prototype.renderPage_ = function(a) {
    if (window.page && $.isFunction(window.page.unload)) {
        window.page.unload();
        sensorsdata.clearReportAjax()
    }
    a = this.formatPageName_(a);
    window.pageName = window.location.pathname;
    this.showLoading();
    $("title").text(sensorsdata.CONSTSET.urlMap[a] + "-神策分析");
    sensorsdata.globalSet.showAjaxLoader = true;
    try {
        hopscotch.endTour()
    } catch (b) {
        sensorsdata.log(b)
    }
    this.renderViewPortWarning_(a);
    switch (a) {
    case "/behavior_path/":
        window.page = new sensorsdata.UserBehaviorPath({
            container: this.saMainDom_,
            events: this.events_,
            initPage: sensorsdata.bind(this.initPage, this),
            finishCallback: sensorsdata.bind(function() {
                this.closeLoading();
                sensorsdata.functionGuide.show()
            }, this)
        });
        break;
    case "/track-manager/":
        window.page = new sensorsdata.TrackManager({
            container: this.saMainDom_,
            events: this.events_,
            initPage: sensorsdata.bind(this.initPage, this),
            finishCallback: sensorsdata.bind(function() {
                this.closeLoading();
                sensorsdata.functionGuide.show()
            }, this)
        });
        break;
    case "/import-status/":
        window.page = new sensorsdata.ImportStatus({
            container: this.saMainDom_,
            events: this.events_,
            initPage: sensorsdata.bind(this.initPage, this),
            finishCallback: sensorsdata.bind(function() {
                this.closeLoading()
            }, this)
        });
        break;
    case "/users/":
        window.page = new sensorsdata.UsersListPage({
            container: this.saMainDom_,
            events: this.events_,
            initPage: sensorsdata.bind(this.initPage, this),
            finishCallback: sensorsdata.bind(function() {
                this.closeLoading();
                sensorsdata.functionGuide.show()
            }, this)
        });
        break;
    case "/sequence/":
        window.page = new sensorsdata.UserEventsPage({
            container: this.saMainDom_,
            events: this.events_,
            initPage: sensorsdata.bind(this.initPage, this),
            finishCallback: sensorsdata.bind(function() {
                this.closeLoading()
            }, this)
        });
        break;
    case "/segmentation/":
        window.page = new sensorsdata.SegmentationIndexPage({
            container: this.saMainDom_,
            events: this.events_,
            initPage: sensorsdata.bind(this.initPage, this),
            finishCallback: sensorsdata.bind(function() {
                this.closeLoading();
                sensorsdata.functionGuide.show()
            }, this)
        });
        break;
    case "/retention/":
        window.page = new sensorsdata.RetentionIndexPage({
            container: this.saMainDom_,
            events: this.events_,
            initPage: sensorsdata.bind(this.initPage, this),
            finishCallback: sensorsdata.bind(function() {
                this.closeLoading();
                sensorsdata.functionGuide.show()
            }, this)
        });
        break;
    case "/addiction/":
        window.page = new sensorsdata.RetentionAddictionPage({
            container: this.saMainDom_,
            events: this.events_,
            initPage: sensorsdata.bind(this.initPage, this),
            finishCallback: sensorsdata.bind(function() {
                this.closeLoading();
                sensorsdata.functionGuide.show()
            }, this)
        });
        break;
    case "/funnel/":
        window.page = new sensorsdata.FunnelIndexPage({
            container: this.saMainDom_,
            events: this.events_,
            initPage: sensorsdata.bind(this.initPage, this),
            finishCallback: sensorsdata.bind(function() {
                this.closeLoading()
            }, this)
        });
        break;
    case "/import/":
        window.page = new sensorsdata.ImportPage({
            container: this.saMainDom_,
            finishCallback: sensorsdata.bind(function() {
                this.closeLoading()
            }, this)
        });
        break;
    case "/clustering/":
        window.page = new sensorsdata.ClusteringIndexPage({
            container: this.saMainDom_,
            events: this.events_,
            initPage: sensorsdata.bind(this.initPage, this),
            finishCallback: sensorsdata.bind(function() {
                this.closeLoading();
                sensorsdata.functionGuide.show()
            }, this)
        });
        break;
    case "/user_analytics/":
        window.page = new sensorsdata.UserAnalyticsIndexPage({
            container: this.saMainDom_,
            events: this.events_,
            initPage: sensorsdata.bind(this.initPage, this),
            finishCallback: sensorsdata.bind(function() {
                this.closeLoading();
                sensorsdata.functionGuide.show()
            }, this)
        });
        break;
    case "/dashboard/":
        sensorsdata.globalSet.showAjaxLoader = false;
        window.page = new sensorsdata.DashboardPage({
            container: this.saMainDom_,
            events: this.events_,
            finishCallback: sensorsdata.bind(function() {
                this.closeLoading();
                sensorsdata.functionGuide.show()
            }, this)
        });
        break;
    case "/events/":
        sensorsdata.authority.checkPageAuth(this, function() {
            window.page = new sensorsdata.EventsManage({
                container: this.saMainDom_,
                events: this.events_,
                closeLoading: sensorsdata.bind(this.closeLoading, this)
            })
        });
        break;
    case "/auth/":
        sensorsdata.authority.checkPageAuth(this, function() {
            window.page = new sensorsdata.AuthManage({
                container: this.saMainDom_,
                events: this.events_,
                closeLoading: sensorsdata.bind(this.closeLoading, this)
            })
        });
        break;
    case "/simulator/":
        sensorsdata.authority.checkPageAuth(this, function() {
            window.page = new sensorsdata.DataSimulator({
                container: this.saMainDom_,
                events: this.events_,
                closeLoading: sensorsdata.bind(this.closeLoading, this)
            })
        });
        break;
    case "/vtrack/":
        window.page = new sensorsdata.VisualTrackingManager({
            container: this.saMainDom_,
            initPage: sensorsdata.bind(this.initPage, this),
            finishCallback: sensorsdata.bind(function() {
                this.closeLoading();
                sensorsdata.functionGuide.show()
            }, this)
        });
        break;
    default:
        this.closeLoading()
    }
}
;
sensorsdata.IndexPage.prototype.renderViewPortWarning_ = function(a) {
    var c = sensorsdata.CONSTSET;
    var b = c.mobilePages.indexOf(a) === -1 && $("body").width() < c.minBodyWidth;
    $("div.viewport-warning:first").toggle(b)
}
;
sensorsdata.IndexPage.prototype.setDefaultUrl_ = function() {
    var d = window.location.pathname;
    var b = window.location.search;
    var c = window.location.hash;
    d = this.formatPageName_(d);
    if (!d || d === "/" || !sensorsdata.CONSTSET.urlMap[d]) {
        d = this.urlRememberObj.lastPathname;
        if (!d || d === "/" || !sensorsdata.CONSTSET.urlMap[d]) {
            d = "/dashboard/"
        }
        c = this.urlRememberObj[d] || "";
        if (d === "/dashboard/") {
            sensorsdata.dashboardList.clickNavFirst()
        }
        this.isDashboardNoHash = d === "/dashboard/" && (!c || c === "#");
        var a = d + b + c;
        window.history.replaceState(a, "", a);
        return
    }
    if (!c || c === "#") {
        c = this.urlRememberObj[d];
        if (c && c !== "#") {
            window.history.replaceState(d + b + c, "", c)
        } else {
            if (d === "/dashboard/") {
                this.isDashboardNoHash = true
            }
        }
    }
}
;
sensorsdata.IndexPage.prototype.getConfig_ = function(a) {
    return sensorsdata.ajax({
        showCommonError: false,
        showLoader: false,
        url: "config",
        success: function(b) {
            if (!$.isEmptyObject(b)) {
                sensorsdata.cache.config = b;
                if ($.isFunction(a)) {
                    a(b)
                }
            }
        }
    })
}
;
sensorsdata.IndexPage.prototype.getProject_ = function(a) {
    if (!a) {
        return
    }
    sensorsdata.ajax({
        showCommonError: false,
        showLoader: false,
        url: "project/" + a,
        success: function(b) {
            if (!$.isEmptyObject(b)) {
                sensorsdata.cache.project = {
                    name: b.name,
                    cname: b.cname
                };
                $(".sa-alpha").text(b.cname).show()
            } else {
                sensorsdata.info.show("无效的项目，请确保输入正确的链接")
            }
        }
    })
}
;
sensorsdata.IndexPage.prototype.checkLicense_ = function(d) {
    var f = d.license;
    var k = sensorsdata.CONSTSET;
    var b = moment().startOf("day");
    var h = moment(f.install_time, k.timeFormat);
    var g = moment(f.remind_time, k.timeFormat);
    var c = moment(f.expire_time, k.timeFormat);
    var l = moment(f.dead_time, k.timeFormat);
    if (!h.isValid() || !g.isValid() || !c.isValid() || !l.isValid()) {
        console.info("license is invalid.");
        return
    }
    var a = c.clone().subtract(1, "day");
    var j = l.clone().subtract(1, "day");
    this.licenseItems_ = [];
    this.licenseItems_.push({
        name: "安装时间",
        value: h.format(k.dateFormat),
        desc: "系统部署的时间。"
    });
    var e = b.diff(c) >= 0;
    var m = a.format(k.dateFormat);
    this.licenseItems_.push({
        name: "到期时间",
        value: m,
        desc: "您购买的服务的截止日期，到期后暂时无法导入数据。",
        isMatch: e,
        matchText: "已停止导入数据，您购买的服务已于" + m + "到期。"
    });
    e = b.diff(l) >= 0;
    m = j.format(k.dateFormat);
    this.licenseItems_.push({
        name: "停止时间",
        value: m,
        desc: "到期后，您的服务将无法使用。",
        isMatch: e,
        matchText: "已暂停服务，您购买的服务已于" + a.format(k.dateFormat) + "到期。"
    });
    m = f.project_num + "/" + (f.max_project_num > 0 ? f.max_project_num : "无限制");
    this.licenseItems_.push({
        name: "项目限额",
        value: m,
        desc: "您购买的最大项目个数。",
        isMatch: f.max_project_num > 0 && f.project_num > f.max_project_num,
        matchText: "已停止导入数据，当前项目数已超过您购买的最大限额。"
    });
    m = sensorsdata.formatNumber(f.message_num) + "/" + (f.max_message_num > 0 ? sensorsdata.formatNumber(f.max_message_num) : "无限制");
    this.licenseItems_.push({
        name: "数据限额",
        value: m,
        desc: "您购买的最大数据接入量条数。",
        isMatch: f.max_message_num > 0 && f.message_num > f.max_message_num,
        matchText: "已停止导入数据，当前数据量已超过您购买的最大数据接入量限额。"
    });
    m = f.node_num + "/" + (f.max_node_num > 0 ? f.max_node_num : "无限制");
    this.licenseItems_.push({
        name: "节点限额",
        value: m,
        desc: "您购买的最大节点数限额。",
        isMatch: f.max_node_num > 0 && f.node_num > f.max_node_num,
        matchText: "已停止导入数据，当前节点数已超过您购买的最大节点个数。"
    });
    m = f.core_num + "/" + (f.max_core_num > 0 ? f.max_core_num : "无限制");
    this.licenseItems_.push({
        name: "核数限额",
        value: m,
        desc: "您购买的单节点最大核数限额。",
        isMatch: f.max_core_num > 0 && f.core_num > f.max_core_num,
        matchText: "已停止导入数据，当前单节点最大核数已超过您购买的单节点最大核数。"
    });
    m = f.memory_gb + "/" + (f.max_memory_gb > 0 ? f.max_memory_db + "G" : "无限制");
    this.licenseItems_.push({
        name: "内存限额",
        value: m,
        desc: "您购买的单节点最大内存限额。",
        isMatch: f.max_memory_gb > 0 && f.memory_db > f.max_memory_db,
        matchText: "已停止导入数据，当前单节点最大内存已超过您购买的单节点最大内存。"
    });
    sensorsdata.cache.licenseItems = this.licenseItems_;
    $('li[data-for="sa_head_about"]').show();
    var i = $(".sa-expire-remind");
    var n = this.licenseItems_.filter(function(p) {
        return p.isMatch === true
    });
    var o = "";
    if (n.length > 0) {
        o = n[0].matchText;
        i.removeClass("green").addClass("red")
    } else {
        if (b.diff(g) >= 0) {
            i.removeClass("red").addClass("green");
            o = "系统授权将于" + a.format(k.dateFormat) + "到期，到期后暂时无法导入数据。"
        }
    }
    if (o) {
        i.show().tooltip({
            container: "body",
            placement: "right",
            title: o,
            trigger: "hover",
            viewport: "body"
        });
        this.popAbout_()
    } else {
        i.hide()
    }
}
;
sensorsdata.IndexPage.prototype.showLoading = function() {
    $("body").addClass("sa-loading");
    this.loadingBar_.show()
}
;
sensorsdata.IndexPage.prototype.closeLoading = function() {
    $("body").removeClass("sa-loading");
    this.loadingBar_.hide()
}
;
sensorsdata.DemoDataImport = function() {
    this.btnModal = $("#btn_demo_data_import");
    this.modalLayer = $("#modal_data_import_layer");
    this.modalTel = this.modalLayer.find(".data-import-layer-no-tel");
    this.modalHasTel = this.modalLayer.find(".data-import-layer-has-tel");
    this.modalSubmit = this.modalLayer.find("data-import-submit");
    this.modalInputTel = this.modalLayer.find('input[type="tel"]');
    this.elePcNewBtn = $("#sa-head-data-import-tip");
    this.elePhoneNewBtn = $("#sa-head-data-import-tip-phone");
    this.modalBodys = this.modalLayer.find(".modal-body");
    this.getDemoName()
}
;
sensorsdata.DemoDataImport.prototype.getDemoName = function() {
    var a = window.location.host.match(/[^\.]*demo[^\.]*/);
    var b = this;
    if (a && a[0]) {
        sensorsdata.ajax({
            url: "/apply?check=true",
            showCommonError: false,
            data: {
                username: sensorsdata.authority.userName
            },
            success: function(c) {
                if (c.apply !== true) {
                    b.showBtn()
                }
            }
        })
    }
}
;
sensorsdata.DemoDataImport.prototype.showTel = function(a) {
    if (a) {
        this.modalTel.hide();
        this.modalHasTel.show()
    } else {
        this.modalTel.show();
        this.modalHasTel.hide()
    }
    this.modalLayer.modal()
}
;
sensorsdata.DemoDataImport.prototype.confirmSubmit = function() {
    var c = this;
    var b = {
        username: sensorsdata.authority.userName
    };
    var a = this.modalInputTel.val();
    if (this.modalTel.is(":visible")) {
        if (/^1\d{10}$/.test(a)) {
            b.tel = a
        } else {
            sensorsdata.error.show("请输入正确的手机号码");
            return false
        }
    }
    sensorsdata.ajax({
        url: "/apply",
        type: "post",
        showCommonError: false,
        data: JSON.stringify(b),
        success: function() {
            c.modalBodys.eq(0).hide();
            c.modalBodys.eq(1).show();
            $(document.body).removeClass("sa-need-show-import-btn")
        },
        error: function() {
            sensorsdata.error.show("网络出错，请联系管理员");
            c.modalLayer.modal("hide")
        }
    })
}
;
sensorsdata.DemoDataImport.prototype.showBtn = function() {
    var a = this;
    $(document.body).addClass("sa-need-show-import-btn");
    this.btnModal.show().add(this.elePhoneNewBtn).add(this.elePcNewBtn).off("click").on("click", function() {
        if (a.modalLayer.is(":visible")) {
            a.modalLayer.modal("hide");
            return false
        }
        a.modalBodys.eq(0).show();
        a.modalBodys.eq(1).hide();
        sensorsdata.ajax({
            url: "/apply",
            showCommonError: false,
            data: {
                username: sensorsdata.authority.userName,
                position: $(this).attr("data-position")
            },
            success: function(b) {
                if (b.apply === true) {
                    sensorsdata.info.show("您已经申请过接入数据")
                } else {
                    a.showTel(b.tel)
                }
            }
        })
    });
    this.modalLayer.on("click", ".data-import-submit2", function() {
        a.confirmSubmit()
    });
    this.modalLayer.on("click", ".data-import-cancel", function() {
        a.modalLayer.modal("hide")
    });
    this.modalLayer.on("shown.bs.modal", function() {
        a.modalInputTel.focus()
    });
    this.modalLayer.on("click", ".data-import-submit3", function() {
        a.modalLayer.modal("hide")
    })
}
;
sensorsdata.BookMarkList = function(a) {
    this.eleMain = $("#bookmarkshow_out");
    this.clickEleBtn = $("#bookmark_list_btn");
    this.splitSymbol = "-_-";
    this.ajaxData = {};
    this.initPage = a;
    this.init()
}
;
sensorsdata.BookMarkList.prototype = {
    init: function() {
        this.events()
    },
    events: function() {
        var a = this;
        this.clickEleBtn.click(function() {
            if (a.eleMain.is(":visible")) {
                a.hideView()
            } else {
                a.showView()
            }
        });
        this.eleMain.on("click", ".bookmarkshow-main li", function() {
            var c = $(this).attr("data-position").split(a.splitSymbol);
            var b = a.ajaxData[c[0]][c[1]];
            a.presentChart(b);
            a.hideView();
            if ($("#sidebar-toggle").is(":visible")) {
                $("#sa_sidebar").removeClass("shown")
            }
        }).on("click", ".bookmarkshow-sec .bookmarkshow-sec-right-edit", function(c) {
            a.eleMain.find(".bookmarkshow-sec-right-edit").not($(this)).popover("hide");
            c.stopPropagation();
            var b = $(this).closest("li");
            var f = b.attr("data-position").split(a.splitSymbol);
            var d = a.ajaxData[f[0]][f[1]];
            a.bookmarkedit = new sensorsdata.BookmarkSave({
                saveBarDisplay: false,
                deleteButtonDisplay: true,
                dialogAttachElement: $(this),
                dialogContainer: "#bookmarkshow_out",
                bookmarkId: d.id,
                onBookmarkDeleted: function() {
                    b.remove();
                    a.hideView()
                },
                onBookmarkUpdated: function(e) {
                    if (typeof e === "object" && !$.isEmptyObject(e)) {
                        a.ajaxData[f[0]][f[1]] = e;
                        a.renderView(a.ajaxData)
                    } else {
                        sensorsdata.log("编辑书签返回数据有错误")
                    }
                }
            });
            a.bookmarkedit.show()
        })
    },
    renderView: function(b) {
        var a = this;
        function d(f) {
            var e = [];
            $.each(f, function(h, g) {
                var i = {};
                i.glistHeader = sensorsdata.CONSTSET.urlMap[h];
                i.glistType = sensorsdata.CONSTSET.urlMapOrder[h];
                i.glistRows = g;
                e.push(i);
                $.each(g, function(l, k) {
                    var j = JSON.parse(k.data);
                    if (k.time) {
                        k.timeFix = sensorsdata.convertRelativeTimeLabel(k.time)
                    } else {
                        if (j.from_date && j.to_date) {
                            k.timeFix = j.from_date + sensorsdata.CONSTSET.dateRangeSplit + j.to_date
                        }
                    }
                    k.gposition = h + a.splitSymbol + l
                })
            });
            e = sensorsdata.seniorSort(e, "glistType").reverse();
            return {
                glist: e
            }
        }
        var c = Mustache.render($("#tpl_bookmarkshow_out").html(), d(b));
        this.eleMain.html(c)
    },
    renderEmptyView: function() {
        var a = Mustache.render($("#tpl_bookmarkshow_out").html(), {
            nobookmark: true
        });
        this.eleMain.html(a)
    },
    showView: function() {
        var a = this;
        sensorsdata.showFloatLayer({
            floatEle: a.eleMain,
            clickEleBtn: a.clickEleBtn,
            unCloseClass: ["daterangepicker"],
            onLoad: function() {
                var b = $("#sa_sidebar").width();
                a.eleMain.removeClass("bookmarkshow-out-shown").css({
                    left: b - 320
                });
                a.eleMain.show().animate({
                    left: b
                }, 300, function() {
                    a.eleMain.addClass("bookmarkshow-out-shown").attr("style", "display:block")
                })
            },
            onClose: function() {
                a.hideView()
            }
        });
        sensorsdata.ajax({
            url: "bookmarks/all",
            success: function(b) {
                if (typeof b !== "object" || $.isEmptyObject(b)) {
                    sensorsdata.log("书签数据为空 ");
                    a.renderEmptyView()
                } else {
                    a.renderView(b)
                }
                a.ajaxData = b
            }
        })
    },
    hideView: function() {
        if (this.bookmarkedit) {
            this.bookmarkedit.close()
        }
        this.eleMain.animate({
            left: 0
        }, 200, function() {
            $(this).hide()
        })
    },
    presentChart: function(a) {
        if (a) {
            var b = JSON.parse(a.data);
            b[sensorsdata.CONSTSET.bookmarkId] = a.id;
            this.initPage(a.type + "#" + $.param(b))
        } else {
            sensorsdata.log("错误的bookmark数据", a)
        }
    }
};
sensorsdata.DashboardList = function() {
    this.tpl = $("#tpl_dashboard_sidebar").html();
    this.ele = $("#sa_dashboard_list_out");
    this.outEle = $("#sa_sidebar");
    this.clickBtn = this.outEle.find(".sa-sidebar-dashboard-add");
    this.clickBtnShow = $("#sa_dashboard_list_action_show");
    this.clickBtnHide = $("#sa_dashboard_list_action_hide");
    this.dataAll = null ;
    this.isNeedAutoHide = true;
    this.initDashboardTemplate();
    this.init()
}
;
sensorsdata.DashboardList.prototype = {
    constructor: sensorsdata.DashboardList,
    getEleDashboards: function() {
        return this.ele.find(">li[data-nav]")
    },
    getAllCategory: function() {
        var a = this;
        return sensorsdata.ajax({
            url: "dashboards",
            success: function(b) {
                a.dataAll = b
            }
        })
    },
    getDashboardLi: function(a) {
        if (a === "first") {
            return this.ele.find("li[data-nav]:first")
        } else {
            return this.ele.find('li[data-nav="/dashboard/#dashid=' + a + '"]')
        }
    },
    sortShare: function() {
        var a = []
          , b = [];
        $.each(this.dataAll, function(d, c) {
            if (c.user_id === sensorsdata.authority.userId) {
                a.push(c)
            } else {
                b.push(c)
            }
        });
        this.dataAll = a.concat(b)
    },
    renderView: function() {
        var a = {};
        this.sortShare();
        a.glist = this.dataAll;
        a.isShare = function() {
            return this.user_id !== sensorsdata.authority.userId
        }
        ;
        this.ele.html(Mustache.render(this.tpl, a));
        if (this.ele.width() < 50) {
            this.ele.find("a[title]").tooltip({
                container: "body",
                placement: "right"
            })
        }
    },
    renderEmptyView: function() {
        if (sensorsdata.authority.isAdmin || sensorsdata.authority.isAnalyst) {
            $("#sa-main").html(Mustache.render($("#tpl_dashboard_empty_state").html(), {
                value: "您暂时还没有创建数据概览，请在左侧数据概览处添加"
            }));
            $("#sa-main .dashboard-blank-slate").show()
        } else {
            $("#sa-main").html(Mustache.render($("#tpl_dashboard_empty_state").html(), {
                value: "您暂时还没有数据概览，请联系管理员共享"
            }));
            $("#sa_sidebar").html("");
            $("#sa-main .dashboard-blank-slate").show()
        }
    },
    addView: function(a) {
        var b = this;
        sensorsdata.ajax({
            url: "dashboards",
            type: "post",
            contentType: "application/json",
            data: JSON.stringify({
                name: a
            }),
            success: function(c) {
                if ($.type(c) === "object" && c.id) {
                    b.loadView(c.id)
                }
            }
        })
    },
    switchNavView: function() {
        var a = [];
        this.getEleDashboards().each(function(d, c) {
            a.push($(c).attr("data-dashid"))
        });
        sensorsdata.ajax({
            url: "dashboards",
            type: "patch",
            contentType: "application/json",
            data: JSON.stringify(a)
        })
    },
    initDashboardTemplate: function() {
        var a = this;
        sensorsdata.ajax({
            url: "dashboard/import/all",
            error: function() {
                console.log("failed to get import list ")
            },
            success: function(b) {
                a.dashboardTemplateList_ = b;
                if (!$.isEmptyObject(a.dashboardTemplateList_)) {
                    a.initDashboardTemplatePropertyList()
                }
            }
        })
    },
    initDashboardTemplatePropertyList: function() {
        var a = this;
        var b = function(c, d) {
            Object.keys(d).map(function(f) {
                var g = d[f];
                var e = g.data_type;
                if (!(c[e] || false)) {
                    c[e] = {}
                }
                if (!(c[e][g.name] || false)) {
                    c[e][g.name] = g
                }
            });
            $.map(c, function(f, e) {
                c[e] = Object.keys(f).map(function(g) {
                    return f[g]
                })
            })
        };
        a.dashboardTemplateProperties = {
            EVENT_PROPERY: {},
            PROFILE_PROPERTY: {}
        };
        sensorsdata.ajax({
            url: "property/all",
            error: function() {
                console.log("failed to get all event properties")
            },
            success: function(d) {
                var c = a.dashboardTemplateProperties.EVENT_PROPERY;
                b(c, d)
            }
        });
        sensorsdata.ajax({
            url: "property/user/properties",
            error: function() {
                console.log("failed to get all user properties")
            },
            success: function(d) {
                var c = a.dashboardTemplateProperties.PROFILE_PROPERTY;
                b(c, d)
            }
        })
    },
    initDashboardTemplateConf: function(c) {
        var b = this;
        var a = $("#sa_dashboard_template_list_select").val();
        sensorsdata.ajax({
            url: "dashboard/import_conf/" + a,
            error: function() {
                console.log("failed to get import conf " + a)
            },
            success: function(f) {
                var e = 1;
                var h = function() {
                    return e++
                };
                var d = function() {
                    return e === f.length + 1
                };
                var g = {
                    orders: f,
                    idx: h,
                    is_last_order: d
                };
                Object.keys(f).map(function(i) {
                    Object.keys(f[i]).map(function(j) {
                        var k = f[i][j];
                        k.is_select = true;
                        if (k.type === "CONSTANT") {
                            k.is_select = false;
                            k.is_number = (k.data_type.toLowerCase() === "number");
                            k.is_text = (k.data_type.toLowerCase() === "string")
                        } else {
                            if (k.type === "EVENT") {
                                k.choices = sensorsdata.cache.events
                            } else {
                                k.choices = b.dashboardTemplateProperties[k.type][k.data_type.toLowerCase()]
                            }
                        }
                    })
                });
                c.find(".template-conf").html(Mustache.render($("#tpl_dashboard_import_popover_table").html(), g));
                c.find(".import_conf_select").multiselect({
                    includeFilterClearBtn: false,
                    enableFiltering: true
                })
            }
        })
    },
    initDashboardTemplateList: function(d) {
        var c = this;
        var a = d.find(".dashboard-template");
        if ($.isEmptyObject(c.dashboardTemplateList_)) {
            return
        }
        var b = function() {
            if (a.is(":visible")) {
                d.find(".icon-expand-down-single").hide();
                d.find(".icon-collapse-up-single").show()
            } else {
                d.find(".icon-collapse-up-single").hide();
                d.find(".icon-expand-down-single").show()
            }
        };
        d.find(".pop-is-template").show();
        b();
        d.find(".pop-is-template").unbind("click").bind("click", function() {
            if (!a.is(":visible")) {
                c.initDashboardTemplateConf(a)
            }
            a.toggle();
            b()
        });
        d.find(".template-list").html(Mustache.render($("#tpl_dashboard_import_list").html(), c.dashboardTemplateList_));
        $("#sa_dashboard_template_list_select").multiselect({
            includeFilterClearBtn: false,
            enableFiltering: true,
            onChange: sensorsdata.bind(function() {
                c.initDashboardTemplateConf(a)
            }, $("#sa_dashboard_template_list_select"))
        })
    },
    importDashboardTemplate: function(d, b) {
        var f = this;
        var h = {};
        var a = b.find(".import_conf_value");
        for (var c = 0; c !== a.length; c++) {
            if ($(a[c]).val() === "") {
                sensorsdata.form.addError($(a[c]), "请输入模板参数", true, {
                    container: b.find(".popover"),
                    trigger: "hover",
                    placement: "top"
                });
                return
            }
            h[$(a[c]).attr("data-name")] = $(a[c]).val()
        }
        var g = {
            name: d,
            kv: h
        };
        var e = $("#sa_dashboard_template_list_select").val();
        sensorsdata.ajax({
            method: "POST",
            data: JSON.stringify(g),
            showCommonError: true,
            url: "dashboard/import/" + e,
            error: function() {
                console.log("failed to get import list ")
            },
            success: function(i) {
                console.log(i);
                if (i.error.length === 0) {
                    f.loadView(i.id);
                    b.find(".popover").hide();
                    return
                }
                i.error.map(function(j) {
                    var k;
                    if (j === "name") {
                        k = $("#sa_dashboard_edit_input")
                    } else {
                        k = $("#dashboard_import_" + j)
                    }
                    sensorsdata.form.addError(k, i.err_msg, true, {
                        container: b.find(".popover"),
                        trigger: "hover",
                        placement: "top"
                    })
                })
            }
        })
    },
    events_: function() {
        var a = this;
        sensorsdata.popover({
            title: "创建新的概览",
            content: '名称：<input type="text" placeholder="请输入数据概览名称" value="" id="sa_dashboard_edit_input"/>',
            ele: this.clickBtn,
            placement: "bottom",
            template: $("#tpl_dashboard_import_popover").html(),
            onShow: function() {
                var c = $(this.container);
                sensorsdata.form.removeChildrenError(c);
                $("#sa_dashboard_edit_input").focus();
                a.initDashboardTemplateList(c);
                c.find(".pop-is-success").unbind("click").bind("click", function() {
                    sensorsdata.form.removeChildrenError(c);
                    var e = $("#sa_dashboard_edit_input");
                    var d = $.trim(e.val());
                    if (d === "") {
                        sensorsdata.form.addError(e, "请输入数据概览的名称", true, {
                            container: c.find(".popover"),
                            placement: "top"
                        });
                        return
                    }
                    if (c.find(".dashboard-template").is(":visible")) {
                        a.importDashboardTemplate(d, c)
                    } else {
                        a.addView(d);
                        c.find("popover").hide()
                    }
                })
            }
        });
        this.clickBtnShow.on("click", function() {
            a.isNeedAutoHide = false;
            a.getEleDashboards().show();
            $(this).hide();
            a.clickBtnHide.show()
        });
        this.clickBtnHide.on("click", function() {
            var c = a.getEleDashboards();
            if (c.size() > 3) {
                c.slice(3).hide();
                $(this).hide();
                a.clickBtnShow.show()
            }
        });
        var b = this.ele.get(0);
        Sortable.create(b, {
            onSort: function() {
                a.switchNavView()
            },
            animation: 200,
            draggable: ".g-drag-sort"
        })
    },
    loadView: function(b) {
        var c = this;
        var a = this.getAllCategory();
        $.when(a).then(function() {
            if ($.isArray(c.dataAll) && c.dataAll.length > 0) {
                c.renderView()
            }
            if (typeof b !== "undefined") {
                if ($.isFunction(b)) {
                    b()
                } else {
                    c.getDashboardLi(b).trigger("click")
                }
            }
        });
        return a
    },
    hideMore: function() {
        if (window.location.pathname !== "/dashboard/" && sensorsdata.authority.isNormal !== true) {
            var a = this.getEleDashboards();
            if (a.size() > 3) {
                a.slice(3).hide();
                this.clickBtnShow.show()
            }
        }
    },
    navShownStatus: function(a) {
        var b = this.getEleDashboards();
        if (sensorsdata.authority.isNormal === true) {
            b.show();
            return
        }
        if (b.size() > 3) {
            if (b.index(a) < 3) {
                b.slice(3).hide();
                this.clickBtnHide.hide();
                this.clickBtnShow.show()
            } else {
                if (b.size() < 3) {
                    this.clickBtnShow.hide();
                    this.clickBtnHide.show()
                } else {
                    this.clickBtnHide.hide();
                    this.clickBtnShow.hide()
                }
            }
        }
    },
    clickNavFirst: function() {
        $.when(this.loadStatus).then(function() {
            var a = $("#sa_dashboard_list_out").find('li[data-nav*="/dashboard/"]:first');
            if (a.length !== 0) {
                sensorsdata.indexPage.isDashboardNoHash = true;
                a.trigger("click")
            }
        })
    },
    init: function() {
        var a = this;
        this.events_();
        this.loadStatus = this.loadView(function() {
            a.hideMore()
        })
    }
};
$(function() {
    sensorsdata.indexPage = new sensorsdata.IndexPage()
});
