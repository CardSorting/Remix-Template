import {
  Auth0Service,
  require_node
} from "/build/_shared/chunk-3WZLLD32.js";
import {
  Form,
  Link,
  Outlet,
  useLoaderData
} from "/build/_shared/chunk-OMGU7OF6.js";
import "/build/_shared/chunk-U4FRFQSK.js";
import {
  require_jsx_dev_runtime
} from "/build/_shared/chunk-XGOTYLZ5.js";
import {
  createHotContext
} from "/build/_shared/chunk-JGV3INUP.js";
import "/build/_shared/chunk-UWV35TSL.js";
import "/build/_shared/chunk-7M6SC7J5.js";
import {
  __toESM
} from "/build/_shared/chunk-PNG5AS42.js";

// app/routes/dashboard.layout.tsx
var import_node = __toESM(require_node());
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime());
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/routes/dashboard.layout.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/routes/dashboard.layout.tsx"
  );
  import.meta.hot.lastModified = "1723532403610.7805";
}
if (!process.env.AUTH0_DOMAIN || !process.env.AUTH0_CLIENT_ID || !process.env.AUTH0_CLIENT_SECRET || !process.env.AUTH0_AUDIENCE || !process.env.AUTH0_CALLBACK_URL || !process.env.AUTH0_LOGOUT_RETURN_TO || !process.env.SESSION_SECRET) {
  throw new Error("Missing AUTH0 environment variables");
}
var auth0 = new Auth0Service(process.env.AUTH0_DOMAIN, process.env.AUTH0_CLIENT_ID, process.env.AUTH0_CLIENT_SECRET, process.env.AUTH0_AUDIENCE, process.env.AUTH0_CALLBACK_URL, process.env.AUTH0_LOGOUT_RETURN_TO, process.env.SESSION_SECRET);
function DashboardLayout() {
  _s();
  const {
    user
  } = useLoaderData();
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "dashboard-layout", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("header", { className: "bg-gray-800 text-white p-4", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "container mx-auto flex justify-between items-center", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h1", { className: "text-2xl font-bold", children: "Dashboard" }, void 0, false, {
        fileName: "app/routes/dashboard.layout.tsx",
        lineNumber: 55,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "flex items-center space-x-4", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: [
          "Welcome, ",
          user.name || user.email
        ] }, void 0, true, {
          fileName: "app/routes/dashboard.layout.tsx",
          lineNumber: 57,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Form, { action: "/logout", method: "post", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", { type: "submit", className: "bg-red-500 hover:bg-red-600 px-4 py-2 rounded", children: "Logout" }, void 0, false, {
          fileName: "app/routes/dashboard.layout.tsx",
          lineNumber: 59,
          columnNumber: 15
        }, this) }, void 0, false, {
          fileName: "app/routes/dashboard.layout.tsx",
          lineNumber: 58,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "app/routes/dashboard.layout.tsx",
        lineNumber: 56,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/dashboard.layout.tsx",
      lineNumber: 54,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "app/routes/dashboard.layout.tsx",
      lineNumber: 53,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "container mx-auto mt-8 flex", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("nav", { className: "w-1/4 pr-8", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("ul", { className: "space-y-2", children: [
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("li", { children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Link, { to: "/dashboard", className: "block p-2 hover:bg-gray-100 rounded", children: "Dashboard Home" }, void 0, false, {
          fileName: "app/routes/dashboard.layout.tsx",
          lineNumber: 71,
          columnNumber: 15
        }, this) }, void 0, false, {
          fileName: "app/routes/dashboard.layout.tsx",
          lineNumber: 70,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("li", { children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Link, { to: "/dashboard/products/dashboard-products-list", className: "block p-2 hover:bg-gray-100 rounded", children: "Products" }, void 0, false, {
          fileName: "app/routes/dashboard.layout.tsx",
          lineNumber: 76,
          columnNumber: 15
        }, this) }, void 0, false, {
          fileName: "app/routes/dashboard.layout.tsx",
          lineNumber: 75,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("li", { children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Link, { to: "/dashboard/sources/dashboard-sources-list", className: "block p-2 hover:bg-gray-100 rounded", children: "Sources" }, void 0, false, {
          fileName: "app/routes/dashboard.layout.tsx",
          lineNumber: 81,
          columnNumber: 15
        }, this) }, void 0, false, {
          fileName: "app/routes/dashboard.layout.tsx",
          lineNumber: 80,
          columnNumber: 13
        }, this),
        user.email === "admin@example.com" && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("li", { children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Link, { to: "/admin/admin-home", className: "block p-2 hover:bg-gray-100 rounded", children: "Admin Panel" }, void 0, false, {
          fileName: "app/routes/dashboard.layout.tsx",
          lineNumber: 86,
          columnNumber: 17
        }, this) }, void 0, false, {
          fileName: "app/routes/dashboard.layout.tsx",
          lineNumber: 85,
          columnNumber: 52
        }, this)
      ] }, void 0, true, {
        fileName: "app/routes/dashboard.layout.tsx",
        lineNumber: 69,
        columnNumber: 11
      }, this) }, void 0, false, {
        fileName: "app/routes/dashboard.layout.tsx",
        lineNumber: 68,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("main", { className: "w-3/4", children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Outlet, {}, void 0, false, {
        fileName: "app/routes/dashboard.layout.tsx",
        lineNumber: 94,
        columnNumber: 11
      }, this) }, void 0, false, {
        fileName: "app/routes/dashboard.layout.tsx",
        lineNumber: 93,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "app/routes/dashboard.layout.tsx",
      lineNumber: 67,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/dashboard.layout.tsx",
    lineNumber: 52,
    columnNumber: 10
  }, this);
}
_s(DashboardLayout, "FpjQZylbefWQChk+MjGNfSb2jDo=", false, function() {
  return [useLoaderData];
});
_c = DashboardLayout;
function ErrorBoundary({
  error
}) {
  console.error(error);
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "error-container", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h1", { children: "Error" }, void 0, false, {
      fileName: "app/routes/dashboard.layout.tsx",
      lineNumber: 110,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", { children: "Sorry, an unexpected error occurred in the dashboard." }, void 0, false, {
      fileName: "app/routes/dashboard.layout.tsx",
      lineNumber: 111,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/dashboard.layout.tsx",
    lineNumber: 109,
    columnNumber: 10
  }, this);
}
_c2 = ErrorBoundary;
function CatchBoundary() {
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "error-container", children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h1", { children: "Oops!" }, void 0, false, {
      fileName: "app/routes/dashboard.layout.tsx",
      lineNumber: 119,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", { children: "Something went wrong. Please try again later or contact support if the problem persists." }, void 0, false, {
      fileName: "app/routes/dashboard.layout.tsx",
      lineNumber: 120,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/routes/dashboard.layout.tsx",
    lineNumber: 118,
    columnNumber: 10
  }, this);
}
_c3 = CatchBoundary;
var _c;
var _c2;
var _c3;
$RefreshReg$(_c, "DashboardLayout");
$RefreshReg$(_c2, "ErrorBoundary");
$RefreshReg$(_c3, "CatchBoundary");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;
export {
  ErrorBoundary,
  DashboardLayout as default
};
//# sourceMappingURL=/build/routes/dashboard.layout-PCVMIY7F.js.map
