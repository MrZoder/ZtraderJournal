import React, { useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent, BubbleMenu, FloatingMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import HardBreak from "@tiptap/extension-hard-break";
import {
  Bold, Italic, Underline as UIcon, Strikethrough, List, ListOrdered,
  ListChecks, Quote, Code, Minus, Image as ImageIcon, Link2, Unlink,
  AlignLeft, AlignCenter, AlignRight, Highlighter, Type
} from "lucide-react";

const isHttpUrl = (s) => /^https?:\/\/\S+$/i.test((s || "").trim());

function ToolbarButton({ active, onClick, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`px-2 py-1 rounded-lg border transition ${
        active
          ? "bg-[rgba(0,255,163,0.18)] text-[rgba(0,255,163,0.95)] border-[rgba(0,255,163,0.35)]"
          : "bg-zinc-900/60 text-zinc-300 border-white/10 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

// Small inline panel to add/edit link (no browser prompt)
function LinkPanel({ visible, currentHref, onSubmit, onRemove, anchorRef }) {
  const [value, setValue] = useState(currentHref || "");
  const panelRef = useRef(null);
  useEffect(() => setValue(currentHref || ""), [currentHref]);
  if (!visible) return null;

  const style = { top: 0, left: 0 };
  // crude positioning near the anchor
  if (anchorRef?.current) {
    const r = anchorRef.current.getBoundingClientRect();
    style.top = r.bottom + window.scrollY + 8;
    style.left = r.left + window.scrollX;
  }

  return (
    <div
      ref={panelRef}
      style={{ position: "absolute", ...style, zIndex: 60 }}
      className="rounded-xl border border-white/10 bg-zinc-900/95 shadow-xl p-2 flex items-center gap-2"
    >
      <input
        autoFocus
        className="bg-zinc-800 text-zinc-100 border border-white/10 rounded-lg px-2 py-1 w-[280px] outline-none focus:border-emerald-400/50"
        placeholder="https://example.com"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit?.(value);
          if (e.key === "Escape") onSubmit?.(null);
        }}
      />
      <button
        className="px-2 py-1 rounded-md bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-semibold"
        onClick={() => onSubmit?.(value)}
      >
        Save
      </button>
      <button
        className="px-2 py-1 rounded-md bg-zinc-700/70 hover:bg-zinc-700 text-white text-xs"
        onClick={() => onRemove?.()}
        title="Remove link"
      >
        Remove
      </button>
    </div>
  );
}

export default function RichTextEditor({
  content = "<p></p>",
  onContentChange,
  onUploadImage,                 // async (File) => url
  placeholder = "Write your journal entry…",
}) {
  const [showLinkPanel, setShowLinkPanel] = useState(false);
  const [linkHref, setLinkHref] = useState("");
  const linkBtnRef = useRef(null);
  const colorInputRef = useRef(null);
  const fileRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
        hardBreak: false, // use HardBreak ext instead
      }),
      HardBreak.configure({ keepMarks: true }),
      Underline,
      Link.configure({
        openOnClick: true,
        autolink: true,
        validate: (href) => isHttpUrl(href),
      }),
      Image,
      TaskList,
      TaskItem.configure({ nested: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
      TextStyle,
      Color.configure({ types: ["textStyle"] }),
      Highlight,
    ],
    content,
    editorProps: {
      handlePaste(view, event) {
        // paste image
        const img = [...event.clipboardData.items].find((i) => i.type.includes("image"));
        if (img) {
          const file = img.getAsFile();
          insertImage(file);
          return true;
        }
        // paste http(s) url → auto link
        const txt = event.clipboardData.getData("text/plain");
        if (isHttpUrl(txt)) {
          const { from, to } = view.state.selection;
          if (from !== to) {
            editor.chain().focus().setLink({ href: txt.trim() }).run();
          } else {
            editor
              .chain()
              .focus()
              .insertContent(`<a href="${txt.trim()}" target="_blank" rel="noopener noreferrer">${txt.trim()}</a>`)
              .run();
          }
          return true;
        }
        return false;
      },
      handleDrop(view, event) {
        const file = [...(event.dataTransfer?.files || [])].find((f) => f.type.startsWith("image/"));
        if (file) {
          insertImage(file);
          return true;
        }
        return false;
      },
      attributes: {
        class:
          "prose prose-invert max-w-none min-h-[320px] bg-zinc-900/70 rounded-2xl p-5 border border-zinc-800 " +
          "focus:border-[rgba(0,255,163,0.6)] outline-none " +
          "[&_h1]:text-3xl [&_h2]:text-2xl [&_h3]:text-xl " +
          "[&_blockquote]:border-l-4 [&_blockquote]:border-emerald-400/40 [&_blockquote]:pl-3 " +
          "[&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 " +
          "[&_a]:text-emerald-300 [&_a]:underline [&_img]:rounded-xl [&_img]:max-w-full [&_img]:mx-auto [&_img]:my-3",
      },
    },
    onUpdate({ editor }) {
      onContentChange?.(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const html = editor.getHTML();
    if (content !== html) editor.commands.setContent(content || "<p></p>", false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, editor]);

  const insertImage = async (file) => {
    if (!file) return;
    try {
      const url = (await onUploadImage?.(file)) || URL.createObjectURL(file);
      editor?.chain().focus().setImage({ src: url }).run();
    } catch {
      const url = URL.createObjectURL(file);
      editor?.chain().focus().setImage({ src: url }).run();
    }
  };

  const chain = useMemo(() => editor?.chain().focus(), [editor]);
  if (!editor) return null;

  const openLinkPanel = () => {
    const attrs = editor.getAttributes("link");
    setLinkHref(attrs?.href || "");
    setShowLinkPanel(true);
  };

  const submitLink = (val) => {
    setShowLinkPanel(false);
    if (!val) return;
    const url = val.trim();
    if (!isHttpUrl(url)) return; // silently ignore invalid
    const { from, to } = editor.state.selection;
    if (from === to) {
      editor.chain().focus().insertContent(`<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`).run();
    } else {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const removeLink = () => {
    setShowLinkPanel(false);
    editor.chain().focus().unsetLink().run();
  };

  return (
    <div className="relative rounded-2xl border border-zinc-800 bg-black/30 shadow-2xl">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 p-2 border-b border-zinc-800 bg-zinc-950/60 rounded-t-2xl">
        <select
          onChange={(e) => {
            const v = e.target.value;
            if (v === "p") chain.setParagraph().run();
            else chain.toggleHeading({ level: Number(v) }).run();
          }}
          defaultValue="p"
          className="rounded-lg bg-zinc-900 text-zinc-100 px-2 py-1 border border-white/10"
        >
          <option value="p">Paragraph</option>
          <option value="1">H1</option>
          <option value="2">H2</option>
          <option value="3">H3</option>
        </select>

        <ToolbarButton title="Bold" active={editor.isActive("bold")} onClick={() => chain.toggleBold().run()}><Bold className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton title="Italic" active={editor.isActive("italic")} onClick={() => chain.toggleItalic().run()}><Italic className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton title="Underline" active={editor.isActive("underline")} onClick={() => chain.toggleUnderline().run()}><UIcon className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton title="Strike" active={editor.isActive("strike")} onClick={() => chain.toggleStrike().run()}><Strikethrough className="w-4 h-4" /></ToolbarButton>

        <div className="w-px h-6 bg-white/10 mx-1" />

        <ToolbarButton title="Bullet list" active={editor.isActive("bulletList")} onClick={() => chain.toggleBulletList().run()}><List className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton title="Ordered list" active={editor.isActive("orderedList")} onClick={() => chain.toggleOrderedList().run()}><ListOrdered className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton title="Checklist" active={editor.isActive("taskList")} onClick={() => chain.toggleTaskList().run()}><ListChecks className="w-4 h-4" /></ToolbarButton>

        <div className="w-px h-6 bg-white/10 mx-1" />

        <ToolbarButton title="Quote" active={editor.isActive("blockquote")} onClick={() => chain.toggleBlockquote().run()}><Quote className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton title="Inline code" active={editor.isActive("code")} onClick={() => chain.toggleCode().run()}><Code className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton title="Divider" onClick={() => chain.setHorizontalRule().run()}><Minus className="w-4 h-4" /></ToolbarButton>

        <div className="w-px h-6 bg-white/10 mx-1" />

        <ToolbarButton title="Align left"  active={editor.isActive({ textAlign: "left" })}   onClick={() => chain.setTextAlign("left").run()}><AlignLeft className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton title="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => chain.setTextAlign("center").run()}><AlignCenter className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton title="Align right" active={editor.isActive({ textAlign: "right" })}  onClick={() => chain.setTextAlign("right").run()}><AlignRight className="w-4 h-4" /></ToolbarButton>

        <div className="w-px h-6 bg-white/10 mx-1" />

        <ToolbarButton title="Highlight" active={editor.isActive("highlight")} onClick={() => chain.toggleHighlight().run()}><Highlighter className="w-4 h-4" /></ToolbarButton>
        <input
          ref={colorInputRef}
          type="color"
          defaultValue="#00ffa3"
          onChange={(e) => chain.setColor(e.target.value).run()}
          className="w-8 h-8 rounded-lg bg-transparent border border-white/10 cursor-pointer"
          title="Text color"
        />

        <div className="ml-auto flex items-center gap-1.5">
          <span ref={linkBtnRef} className="inline-flex">
            <ToolbarButton title="Insert/edit link" onClick={openLinkPanel}><Link2 className="w-4 h-4" /></ToolbarButton>
          </span>
          <ToolbarButton title="Remove link" onClick={removeLink}><Unlink className="w-4 h-4" /></ToolbarButton>
          <ToolbarButton title="Insert image" onClick={() => fileRef.current?.click()}><ImageIcon className="w-4 h-4" /></ToolbarButton>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => insertImage(e.target.files?.[0])} />
        </div>
      </div>

      {/* Quick menus */}
      <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
        <div className="flex gap-1 p-1 rounded-xl bg-zinc-900/90 border border-white/10 shadow">
          <ToolbarButton onClick={() => chain.toggleBold().run()} active={editor.isActive("bold")} title="Bold"><Bold className="w-4 h-4" /></ToolbarButton>
          <ToolbarButton onClick={() => chain.toggleItalic().run()} active={editor.isActive("italic")} title="Italic"><Italic className="w-4 h-4" /></ToolbarButton>
          <ToolbarButton onClick={() => chain.toggleUnderline().run()} active={editor.isActive("underline")} title="Underline"><UIcon className="w-4 h-4" /></ToolbarButton>
          <ToolbarButton onClick={() => chain.toggleStrike().run()} active={editor.isActive("strike")} title="Strike"><Strikethrough className="w-4 h-4" /></ToolbarButton>
          <ToolbarButton onClick={() => chain.toggleHighlight().run()} active={editor.isActive("highlight")} title="Highlight"><Highlighter className="w-4 h-4" /></ToolbarButton>
        </div>
      </BubbleMenu>

      <FloatingMenu editor={editor} tippyOptions={{ duration: 100 }}>
        <div className="flex gap-1 p-1 rounded-xl bg-zinc-900/95 border border-white/10 shadow">
          <ToolbarButton title="H1" onClick={() => chain.toggleHeading({ level: 1 }).run()}><Type className="w-4 h-4" /><span className="ml-1 text-xs">H1</span></ToolbarButton>
          <ToolbarButton title="H2" onClick={() => chain.toggleHeading({ level: 2 }).run()}><Type className="w-4 h-4" /><span className="ml-1 text-xs">H2</span></ToolbarButton>
          <ToolbarButton title="Checklist" onClick={() => chain.toggleTaskList().run()}><ListChecks className="w-4 h-4" /></ToolbarButton>
          <ToolbarButton title="Bullet list" onClick={() => chain.toggleBulletList().run()}><List className="w-4 h-4" /></ToolbarButton>
          <ToolbarButton title="Quote" onClick={() => chain.toggleBlockquote().run()}><Quote className="w-4 h-4" /></ToolbarButton>
          <ToolbarButton title="Divider" onClick={() => chain.setHorizontalRule().run()}><Minus className="w-4 h-4" /></ToolbarButton>
        </div>
      </FloatingMenu>

      <div className="p-3 sm:p-4">
        <EditorContent editor={editor} />
      </div>

      {/* Inline link panel */}
      <LinkPanel
        visible={showLinkPanel}
        currentHref={linkHref}
        onSubmit={submitLink}
        onRemove={removeLink}
        anchorRef={linkBtnRef}
      />
    </div>
  );
}
