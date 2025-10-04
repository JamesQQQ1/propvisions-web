'use client';

import React from 'react';

function cx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(' ');
}

export default function UploadShell({ token }: { token: string }) {
  const [files, setFiles] = React.useState<File[]>([]);
  const [dragOver, setDragOver] = React.useState(false);
  const MAX_FILES = 5;
  const MAX_MB = 20;

  function acceptFiles(list: FileList | File[]) {
    const arr = Array.from(list).slice(0, MAX_FILES);
    const filtered = arr.filter(f => f.type.startsWith('image/'));
    setFiles(filtered);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) acceptFiles(e.target.files);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer.files?.length) acceptFiles(e.dataTransfer.files);
  }

  function onDrag(e: React.DragEvent<HTMLDivElement>, over: boolean) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(over);
  }

  function humanSize(bytes: number) {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  }

  const tooMany = files.length > MAX_FILES;
  const tooLarge = files.some(f => f.size > MAX_MB * 1024 * 1024);

  return (
    <form
      className="mt-6 space-y-5"
      action="/api/upload"
      method="post"
      encType="multipart/form-data"
    >
      <input type="hidden" name="token" value={token} />

      <div
        onDragEnter={(e) => onDrag(e, true)}
        onDragOver={(e) => onDrag(e, true)}
        onDragLeave={(e) => onDrag(e, false)}
        onDrop={onDrop}
        className={cx(
          'rounded-lg border border-dashed p-4 transition bg-slate-50',
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:bg-slate-100'
        )}
      >
        <label className="block text-sm font-medium mb-2 text-slate-700">
          Drag & drop images here, or click to choose (up to 5)
        </label>

        <input
          type="file"
          name="files"
          accept="image/*,.heic,.heif"
          multiple
          required
          onChange={onInputChange}
          className="block w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
        />

        <p className="text-xs text-slate-500 mt-2">
          Tip: 1–3 clear angles is perfect. Include flooring, corners, and any fixtures (sinks, windows, radiators).
        </p>
        <p className="text-xs text-slate-500">
          Mobile: you can use your camera directly. HEIC is supported.
        </p>

        {files.length > 0 && (
          <div className="mt-4">
            <div className="text-sm text-slate-700 mb-2">
              {files.length} selected {files.length === 1 ? 'file' : 'files'}
            </div>
            <ul className="grid grid-cols-3 gap-3">
              {files.map((f, i) => (
                <li key={i} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={URL.createObjectURL(f)}
                    alt={f.name}
                    className="w-full h-24 object-cover rounded-md border border-slate-200"
                  />
                  <div className="mt-1 text-[11px] text-slate-600 truncate">{f.name}</div>
                  <div className="text-[10px] text-slate-400">{humanSize(f.size)}</div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(tooMany || tooLarge) && (
          <div className="mt-3 text-sm text-red-600">
            {tooMany && <div>Max {MAX_FILES} images.</div>}
            {tooLarge && <div>Each image must be &lt; {MAX_MB} MB.</div>}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={tooMany || tooLarge || files.length === 0}
        className={cx(
          'w-full py-2.5 px-4 rounded-md text-white font-medium transition',
          tooMany || tooLarge || files.length === 0
            ? 'bg-slate-300 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        )}
      >
        Upload Photos
      </button>

      <p className="text-xs text-slate-400 text-center">
        Secure upload link • expires automatically once processed
      </p>
    </form>
  );
}
