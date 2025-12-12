// src/extensions/TradeEmbed.js
import { Node, mergeAttributes } from "@tiptap/core";

export default Node.create({
  name: "tradeEmbed",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      id: { default: null },
      title: { default: "" },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-trade-id]",
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-trade-id": node.attrs.id,
        class: "inline-block bg-green-600 text-black px-1 py-0.5 rounded text-sm mr-1",
      }),
      `🔗 ${node.attrs.title}`,
    ];
  },

  addCommands() {
    return {
      insertTradeEmbed:
        (attrs) =>
        ({ chain }) => {
          return chain().insertContent({
            type: this.name,
            attrs,
          }).run();
        },
    };
  },
});
