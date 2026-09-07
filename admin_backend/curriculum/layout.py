def generate_layout(graph, view="journey"):
    """Return deterministic Cartesian positions from recommended connections."""
    nodes = graph["nodes"]
    if view != "journey":
        nodes = [node for node in nodes if node["topic"] == view]
    numbers = [node["number"] for node in nodes]
    selected = set(numbers)
    parents = {number: [] for number in numbers}
    children = {number: [] for number in numbers}
    for edge in graph.get("connections", []):
        source, target = edge["source"], edge["target"]
        if source in selected and target in selected:
            parents[target].append(source)
            children[source].append(target)

    levels = {}
    def level(number):
        if number not in levels:
            levels[number] = 0 if not parents[number] else 1 + max(level(parent) for parent in parents[number])
        return levels[number]
    for number in numbers:
        level(number)

    rows = {}
    for number in numbers:
        rows.setdefault(levels[number], []).append(number)

    positions = {}
    for row_number, row in rows.items():
        terminal = [number for number in row if not children[number]]
        continuing = [number for number in row if children[number]]
        split = (len(terminal) + 1) // 2
        ordered = terminal[:split] + continuing + terminal[split:]
        for column, number in enumerate(ordered, 1):
            positions[number] = {
                "x": round(column * 1000 / (len(ordered) + 1), 2),
                "y": row_number * 180,
            }
    return positions


def layout_for(graph, view):
    return {**generate_layout(graph, view), **graph.get("layouts", {}).get(view, {})}
