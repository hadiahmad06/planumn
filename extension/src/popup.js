/** Toolbar popup: check and request host access (Firefox asks per site). Written by Ishaan's Claude. */
(async () => {
  const ext = globalThis.browser ?? globalThis.chrome;
  const origins = ext.runtime.getManifest().host_permissions;
  const status = document.getElementById("status");
  const grant = document.getElementById("grant");

  const render = async () => {
    const has = await ext.permissions.contains({ origins });
    status.textContent = has ? "Ready. Go to planu.mn and choose Import from APAS." : "This extension needs access to APAS and planu.mn.";
    status.className = has ? "ok" : "";
    grant.hidden = has;
  };

  // permissions.request must run directly from a user action, so it's called in the click handler.
  grant.addEventListener("click", () => {
    ext.permissions.request({ origins }).then(render, render);
  });
  await render();
})();
