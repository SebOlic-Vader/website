/* ================================================================
   SCORM-Packer — Single-File-Web-App ohne externe Abhängigkeiten
   ================================================================ */

/*ZIPLIB-START*/
/* Minimaler ZIP-Writer (Methode: STORE, UTF-8-Dateinamen) */
var CRC_TABLE = (function(){
  var t = new Uint32Array(256);
  for (var i = 0; i < 256; i++) {
    var c = i;
    for (var j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c >>> 0;
  }
  return t;
})();
function crc32(data) {
  var c = 0xFFFFFFFF;
  for (var i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function dosDateTime(d) {
  d = d || new Date();
  var time = ((d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2)) & 0xFFFF;
  var date = ((((d.getFullYear() - 1980) & 0x7F) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF;
  return { time: time, date: date };
}
/* files: [{name: string, data: Uint8Array}] -> Uint8Array (ZIP) */
function buildZip(files) {
  var enc = new TextEncoder();
  var dt = dosDateTime();
  var parts = [], central = [], offset = 0;
  function u16(v){ return [v & 0xFF, (v >>> 8) & 0xFF]; }
  function u32(v){ return [v & 0xFF, (v >>> 8) & 0xFF, (v >>> 16) & 0xFF, (v >>> 24) & 0xFF]; }
  files.forEach(function(f){
    var nameBytes = enc.encode(f.name);
    var crc = crc32(f.data);
    var local = [].concat(
      u32(0x04034b50), u16(20), u16(0x0800), u16(0),
      u16(dt.time), u16(dt.date), u32(crc), u32(f.data.length), u32(f.data.length),
      u16(nameBytes.length), u16(0)
    );
    parts.push(new Uint8Array(local), nameBytes, f.data);
    var cent = [].concat(
      u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0),
      u16(dt.time), u16(dt.date), u32(crc), u32(f.data.length), u32(f.data.length),
      u16(nameBytes.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset)
    );
    central.push(new Uint8Array(cent), nameBytes);
    offset += local.length + nameBytes.length + f.data.length;
  });
  var cdSize = central.reduce(function(s, a){ return s + a.length; }, 0);
  var eocd = new Uint8Array([].concat(
    u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length),
    u32(cdSize), u32(offset), u16(0)
  ));
  var total = offset + cdSize + eocd.length;
  var out = new Uint8Array(total), p = 0;
  parts.concat(central, [eocd]).forEach(function(a){ out.set(a, p); p += a.length; });
  return out;
}
/*ZIPLIB-END*/

/*CORE-START*/
function escapeXml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
                  .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function slugify(s) {
  var map = { "ä":"ae","ö":"oe","ü":"ue","Ä":"Ae","Ö":"Oe","Ü":"Ue","ß":"ss" };
  s = String(s).replace(/[äöüÄÖÜß]/g, function(c){ return map[c]; });
  s = s.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "").substring(0, 40);
  return s || "Lernpaket";
}
function buildManifest(title, extraNames) {
  var t = escapeXml(title);
  var id = "PKG_" + slugify(title);
  var extraFiles = (extraNames || []).map(function(n){
    return '      <file href="' + escapeXml(n) + '"/>\n';
  }).join("");
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<manifest identifier="' + id + '" version="1.0"\n' +
    '  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"\n' +
    '  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"\n' +
    '  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n' +
    '  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd\n' +
    '    http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd\n' +
    '    http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">\n' +
    '  <metadata>\n' +
    '    <schema>ADL SCORM</schema>\n' +
    '    <schemaversion>1.2</schemaversion>\n' +
    '  </metadata>\n' +
    '  <organizations default="org1">\n' +
    '    <organization identifier="org1">\n' +
    '      <title>' + t + '</title>\n' +
    '      <item identifier="item1" identifierref="res1">\n' +
    '        <title>' + t + '</title>\n' +
    '      </item>\n' +
    '    </organization>\n' +
    '  </organizations>\n' +
    '  <resources>\n' +
    '    <resource identifier="res1" type="webcontent" adlcp:scormtype="sco" href="index.html">\n' +
    '      <file href="index.html"/>\n' + extraFiles +
    '    </resource>\n' +
    '  </resources>\n' +
    '</manifest>\n';
}

/* SCORM-1.2-Brücke: wird automatisch in HTML-Dateien ohne eigenen SCORM-Code injiziert */
var BRIDGE_JS =
'(function(){"use strict";\n' +
'function findAPI(w){var n=0;try{while(w&&!w.API&&n<15){if(w.parent&&w.parent!==w){w=w.parent}else if(w.opener){w=w.opener}else{break}n++}return(w&&w.API)?w.API:null}catch(e){return null}}\n' +
'var API=findAPI(window);window.__scormAPI=API;if(!API){return}\n' +
'try{API.LMSInitialize("")}catch(e){return}\n' +
'var tracked={};\n' +
'try{\n' +
'var st=API.LMSGetValue("cmi.core.lesson_status");\n' +
'if(st==="not attempted"||st==="unknown"||st===""){API.LMSSetValue("cmi.core.lesson_status","completed")}\n' +
'var sd=API.LMSGetValue("cmi.suspend_data");\n' +
'if(sd){try{var o=JSON.parse(sd);for(var k in o){if(Object.prototype.hasOwnProperty.call(o,k)){tracked[k]=1;try{window.localStorage.setItem(k,o[k])}catch(e2){}}}}catch(e3){}}\n' +
'API.LMSCommit("");\n' +
'}catch(e){}\n' +
'var t=null,warned=false;\n' +
'function collect(){var o={};try{for(var k in tracked){var v=window.localStorage.getItem(k);if(v!==null){o[k]=v}}}catch(e){}return JSON.stringify(o)}\n' +
'function score(){try{var sc=window.localStorage.getItem("scormbridge_score");if(sc===null){return}var n=parseInt(sc,10);if(isNaN(n)){return}n=Math.max(0,Math.min(100,n));API.LMSSetValue("cmi.core.score.raw",String(n));API.LMSSetValue("cmi.core.score.min","0");API.LMSSetValue("cmi.core.score.max","100")}catch(e){}}\n' +
'function sync(){var s=collect();if(s.length>4096&&!warned){warned=true;try{console.warn("SCORM-Bruecke: Daten > 4096 Zeichen, LMS speichert evtl. nicht alles; localStorage bleibt als Fallback.")}catch(e){}}\n' +
'try{score();API.LMSSetValue("cmi.suspend_data",s);API.LMSCommit("")}catch(e){}}\n' +
'function later(){if(t){clearTimeout(t)}t=setTimeout(sync,700)}\n' +
'try{\n' +
'var sp=Storage.prototype,_s=sp.setItem,_r=sp.removeItem,_c=sp.clear;\n' +
'sp.setItem=function(k,v){_s.apply(this,arguments);if(this===window.localStorage){tracked[k]=1;later()}};\n' +
'sp.removeItem=function(k){_r.apply(this,arguments);if(this===window.localStorage){delete tracked[k];later()}};\n' +
'sp.clear=function(){_c.apply(this,arguments);if(this===window.localStorage){tracked={};later()}};\n' +
'}catch(e){}\n' +
'function bye(){try{sync();API.LMSFinish("")}catch(e){}}\n' +
'window.addEventListener("pagehide",bye);window.addEventListener("beforeunload",bye);\n' +
'setTimeout(sync,1500);\n' +
'})();';

function hasScormCode(html) {
  return /LMSInitialize|pipwerks\s*\.\s*SCORM|scorm-bridge-12/i.test(html);
}
function injectBridge(html) {
  var tag = '<script id="scorm-bridge-12">\n' + BRIDGE_JS + '\n<\/script>';
  if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, function(m){ return m + "\n" + tag; });
  if (/<html[^>]*>/i.test(html)) return html.replace(/<html[^>]*>/i, function(m){ return m + "\n" + tag; });
  return tag + "\n" + html;
}
function extractTitle(html) {
  var m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!m) return "";
  return m[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
             .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/\s+/g, " ").trim();
}
/*CORE-END*/

/* ---------------- UI ---------------- */
var state = { html: null, fileName: null, extras: [] };

var dropzone = document.getElementById("dropzone");
var fileInput = document.getElementById("fileInput");
var fileInfo = document.getElementById("fileInfo");
var titleInput = document.getElementById("titleInput");
var buildBtn = document.getElementById("buildBtn");
var successBox = document.getElementById("successBox");
var extraInput = document.getElementById("extraInput");
var extraList = document.getElementById("extraList");

dropzone.addEventListener("click", function(){ fileInput.click(); });
dropzone.addEventListener("keydown", function(e){ if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInput.click(); } });
dropzone.addEventListener("dragover", function(e){ e.preventDefault(); dropzone.classList.add("drag"); });
dropzone.addEventListener("dragleave", function(){ dropzone.classList.remove("drag"); });
dropzone.addEventListener("drop", function(e){
  e.preventDefault(); dropzone.classList.remove("drag");
  if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener("change", function(){ if (fileInput.files.length) handleFile(fileInput.files[0]); });

function handleFile(f) {
  if (!/\.html?$/i.test(f.name)) { alert("Bitte eine .html-Datei auswählen."); return; }
  var reader = new FileReader();
  reader.onload = function() {
    state.html = String(reader.result);
    state.fileName = f.name;
    var detected = hasScormCode(state.html);
    var title = extractTitle(state.html);
    if (title && !titleInput.value) titleInput.value = title;
    fileInfo.className = "file-info show";
    fileInfo.innerHTML = "<strong>" + escapeHtmlUi(f.name) + "</strong> (" + Math.round(f.size / 1024) + " KB)<br>" +
      (detected
        ? '<span class="badge badge-green">SCORM-Code bereits enthalten, die Datei wird unverändert verpackt</span>'
        : '<span class="badge badge-blue">SCORM-Brücke wird eingebaut, der Fortschritt wird in der Lernplattform gespeichert</span>');
    buildBtn.disabled = false;
    successBox.className = "success-box";
  };
  reader.readAsText(f, "UTF-8");
}

extraInput.addEventListener("change", function(){
  state.extras = [];
  var files = Array.prototype.slice.call(extraInput.files);
  var pending = files.length;
  if (!pending) { extraList.textContent = ""; return; }
  files.forEach(function(f){
    var r = new FileReader();
    r.onload = function(){
      state.extras.push({ name: f.name, data: new Uint8Array(r.result) });
      pending--;
      if (!pending) extraList.textContent = state.extras.map(function(x){ return x.name; }).join(", ");
    };
    r.readAsArrayBuffer(f);
  });
});

function escapeHtmlUi(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

buildBtn.addEventListener("click", function(){
  if (!state.html) return;
  var title = titleInput.value.trim() || state.fileName.replace(/\.html?$/i, "");
  var html = state.html;
  var bridged = false;
  if (!hasScormCode(html)) { html = injectBridge(html); bridged = true; }
  var enc = new TextEncoder();
  var files = [
    { name: "imsmanifest.xml", data: enc.encode(buildManifest(title, state.extras.map(function(x){ return x.name; }))) },
    { name: "index.html", data: enc.encode(html) }
  ].concat(state.extras);
  var zip = buildZip(files);
  var blob = new Blob([zip], { type: "application/zip" });
  var name = slugify(title) + "_SCORM12.zip";
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  successBox.className = "success-box show";
  successBox.innerHTML = "<strong>Fertig.</strong> <code>" + escapeHtmlUi(name) + "</code> wurde heruntergeladen" +
    (bridged ? ", inklusive SCORM-Brücke" : "") +
    ". Lade es jetzt in deiner Lernplattform als <strong>Lernpaket</strong> hoch (Anleitung unten).";
});
