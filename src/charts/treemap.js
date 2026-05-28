import { escapeHtml } from "../utils/html.js";

function numericValue(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function sumValues(nodes) {
  return nodes.reduce((sum, node) => sum + numericValue(node.value), 0);
}

function splitNodes(nodes) {
  const total = sumValues(nodes);
  let running = 0;
  let splitIndex = 1;
  let bestDifference = Number.POSITIVE_INFINITY;

  for (let index = 1; index < nodes.length; index += 1) {
    running += numericValue(nodes[index - 1].value);
    const difference = Math.abs((total / 2) - running);

    if (difference < bestDifference) {
      bestDifference = difference;
      splitIndex = index;
    }
  }

  return [nodes.slice(0, splitIndex), nodes.slice(splitIndex)];
}

function binaryTreemap(nodes, rect = { x: 0, y: 0, width: 100, height: 100 }) {
  const visibleNodes = nodes
    .filter(node => numericValue(node.value) > 0)
    .sort((a, b) => numericValue(b.value) - numericValue(a.value));

  if (!visibleNodes.length) return [];

  if (visibleNodes.length === 1) {
    return [{ ...visibleNodes[0], rect }];
  }

  const [firstGroup, secondGroup] = splitNodes(visibleNodes);
  const firstValue = sumValues(firstGroup);
  const total = firstValue + sumValues(secondGroup);

  if (!total) return [];

  if (rect.width >= rect.height) {
    const firstWidth = rect.width * (firstValue / total);

    return [
      ...binaryTreemap(firstGroup, { ...rect, width: firstWidth }),
      ...binaryTreemap(secondGroup, {
        ...rect,
        x: rect.x + firstWidth,
        width: rect.width - firstWidth
      })
    ];
  }

  const firstHeight = rect.height * (firstValue / total);

  return [
    ...binaryTreemap(firstGroup, { ...rect, height: firstHeight }),
    ...binaryTreemap(secondGroup, {
      ...rect,
      y: rect.y + firstHeight,
      height: rect.height - firstHeight
    })
  ];
}

function rowTreemap(nodes, rect) {
  const total = sumValues(nodes);
  let x = rect.x;

  if (!total) return [];

  return nodes.map((node, index) => {
    const isLast = index === nodes.length - 1;
    const width = isLast ? (rect.x + rect.width) - x : rect.width * (numericValue(node.value) / total);
    const placed = {
      ...node,
      rect: {
        x,
        y: rect.y,
        width,
        height: rect.height
      }
    };

    x += width;
    return placed;
  });
}

function priorityStackTreemap(nodes, rect = { x: 0, y: 0, width: 100, height: 100 }) {
  const visibleNodes = nodes
    .filter(node => numericValue(node.value) > 0)
    .sort((a, b) => numericValue(b.value) - numericValue(a.value));

  if (visibleNodes.length <= 3) return binaryTreemap(visibleNodes, rect);

  const topNode = visibleNodes[0];
  const middleNodes = visibleNodes.slice(1, 3);
  const bottomNodes = visibleNodes.slice(3);
  const total = sumValues(visibleNodes);
  const topValue = numericValue(topNode.value);
  const middleValue = sumValues(middleNodes);
  const bottomValue = sumValues(bottomNodes);
  const naturalBottomHeight = rect.height * (bottomValue / total);
  const minimumBottomHeight = Math.min(rect.height * 0.24, Math.max(rect.height * 0.14, bottomNodes.length * 3.75));
  const bottomHeight = bottomNodes.length
    ? Math.min(rect.height * 0.28, Math.max(naturalBottomHeight, minimumBottomHeight))
    : 0;
  const upperHeight = rect.height - bottomHeight;
  const upperValue = topValue + middleValue;
  const middleHeight = middleNodes.length && upperValue
    ? upperHeight * (middleValue / upperValue)
    : 0;
  const topHeight = upperHeight - middleHeight;
  const topRect = { x: rect.x, y: rect.y, width: rect.width, height: topHeight };
  const middleRect = { x: rect.x, y: rect.y + topHeight, width: rect.width, height: middleHeight };
  const bottomRect = { x: rect.x, y: rect.y + topHeight + middleHeight, width: rect.width, height: bottomHeight };

  return [
    { ...topNode, rect: topRect },
    ...rowTreemap(middleNodes, middleRect),
    ...binaryTreemap(bottomNodes, bottomRect)
  ];
}

function nodeArea(node) {
  return node.rect.width * node.rect.height;
}

function tileSizeClass(node) {
  const area = nodeArea(node);
  if (area < 170) return "levy-treemap-tile-tiny";
  if (area < 420) return "levy-treemap-tile-small";
  return "";
}

function tileStyle(node, color, background) {
  return [
    `left: ${node.rect.x.toFixed(4)}%;`,
    `top: ${node.rect.y.toFixed(4)}%;`,
    `width: ${node.rect.width.toFixed(4)}%;`,
    `height: ${node.rect.height.toFixed(4)}%;`,
    `--tile-color: ${color};`,
    `--tile-bg: ${background};`
  ].join(" ");
}

function groupItems(items) {
  const groups = new Map();

  items.forEach(item => {
    const key = item.group || "Other";
    const group = groups.get(key) || {
      id: key,
      label: item.groupLabel || key,
      group: key,
      value: 0,
      amount: 0,
      color: item.color,
      children: []
    };

    group.value += numericValue(item.value);
    group.amount += numericValue(item.amount);
    group.children.push(item);
    groups.set(key, group);
  });

  return Array.from(groups.values())
    .map(group => ({
      ...group,
      children: group.children.sort((a, b) => numericValue(b.value) - numericValue(a.value))
    }))
    .sort((a, b) => numericValue(b.value) - numericValue(a.value));
}

function renderControls(controls, groups, activeGroup) {
  if (!controls) return;

  controls.innerHTML = [
    { id: "all", label: "All" },
    ...groups
  ].map(group => `
    <button
      type="button"
      class="levy-treemap-filter${activeGroup === group.id ? " is-active" : ""}"
      data-treemap-group="${escapeHtml(group.id)}"
      aria-pressed="${activeGroup === group.id ? "true" : "false"}"
    >${escapeHtml(group.label)}</button>
  `).join("");
}

function renderNestedTiles(node, options) {
  if (!node.children || node.children.length < 2 || nodeArea(node) < 1250) return "";

  const nested = binaryTreemap(node.children, { x: 0, y: 0, width: 100, height: 100 });

  return `
    <span class="levy-treemap-nested" aria-hidden="true">
      ${nested.map(child => `
        <span
          class="levy-treemap-nested-tile ${tileSizeClass(child)}"
          style="${tileStyle(child, child.color, options.colorAlpha(child.color, 0.68))}"
        >
          <span>${escapeHtml(child.label)}</span>
        </span>
      `).join("")}
    </span>
  `;
}

function renderTile(node, options) {
  const share = options.formatShare(numericValue(node.value) / options.shareTotal);
  const amount = options.formatAmount(node.amount);
  const background = options.activeGroup === "all"
    ? options.colorAlpha(node.color, 0.20)
    : options.colorAlpha(node.color, 0.74);
  const isFilterTile = options.activeGroup === "all";
  const tagName = "button";
  const actionAttrs = isFilterTile
    ? `type="button" data-treemap-group="${escapeHtml(node.id)}"`
    : `type="button" data-treemap-node="${escapeHtml(node.id)}"`;
  const ariaLabel = `${node.label}: ${share}${amount ? `, ${amount}` : ""}`;

  return `
    <${tagName}
      class="levy-treemap-tile ${tileSizeClass(node)}${isFilterTile ? " levy-treemap-filter-tile" : " levy-treemap-detail-tile"}"
      style="${tileStyle(node, node.color, background)}"
      aria-label="${escapeHtml(ariaLabel)}"
      ${actionAttrs}
    >
      <span class="levy-treemap-tile-copy">
        <span class="levy-treemap-tile-label">${escapeHtml(node.label)}</span>
        <span class="levy-treemap-tile-share">${escapeHtml(share)}</span>
        ${amount ? `<span class="levy-treemap-tile-amount">${escapeHtml(amount)}</span>` : ""}
      </span>
      ${options.activeGroup === "all" ? renderNestedTiles(node, options) : ""}
    </${tagName}>
  `;
}

export function renderGroupedTreemap({
  container,
  controls,
  items,
  colorAlpha,
  formatAmount,
  formatShare,
  initialGroup = "all",
  ariaLabel = "Latest distribution chart",
  onGroupChange,
  showControls = false,
  layout = "binary"
}) {
  if (!container) return;

  const groups = groupItems(items || []);
  let activeGroup = groups.some(group => group.id === initialGroup) ? initialGroup : "all";
  let activeNodeId = null;
  const total = sumValues(groups);

  function render() {
    if (showControls) {
      renderControls(controls, groups, activeGroup);
    } else if (controls) {
      controls.innerHTML = "";
    }

    if (!groups.length || !total) {
      container.innerHTML = `<p class="levy-treemap-empty">No levy distribution data is available.</p>`;
      return;
    }

    const groupNodes = activeGroup === "all"
      ? groups
      : groups.find(group => group.id === activeGroup)?.children || [];
    const selectedNode = activeNodeId
      ? groupNodes.find(node => node.id === activeNodeId)
      : null;
    const activeNodes = selectedNode ? [selectedNode] : groupNodes;
    const activeTotal = activeGroup === "all" ? total : sumValues(activeNodes);
    const nodes = activeGroup === "all" && layout === "priority-stack"
      ? priorityStackTreemap(activeNodes)
      : binaryTreemap(activeNodes);

    container.innerHTML = `
      <div class="levy-treemap-canvas" role="img" aria-label="${escapeHtml(ariaLabel)}">
        ${nodes.map(node => renderTile(node, {
          activeGroup,
          colorAlpha,
          formatAmount,
          formatShare,
          total: activeTotal,
          shareTotal: total
        })).join("")}
      </div>
    `;

    onGroupChange?.(activeGroup, activeNodes);
  }

  controls?.addEventListener("click", event => {
    const button = event.target.closest("[data-treemap-group]");
    if (!button) return;

    activeGroup = button.dataset.treemapGroup || "all";
    activeNodeId = null;
    render();
  });

  container.addEventListener("click", event => {
    const button = event.target.closest(".levy-treemap-filter-tile[data-treemap-group]");
    if (button) {
      activeGroup = button.dataset.treemapGroup || "all";
      activeNodeId = null;
      render();
      return;
    }

    const detailButton = event.target.closest(".levy-treemap-detail-tile[data-treemap-node]");
    if (!detailButton) return;

    const groupNodes = groups.find(group => group.id === activeGroup)?.children || [];
    const nodeId = detailButton.dataset.treemapNode || null;
    if (activeNodeId === nodeId || groupNodes.length <= 1) {
      activeGroup = "all";
      activeNodeId = null;
    } else {
      activeNodeId = nodeId;
    }
    render();
  });

  render();
}
