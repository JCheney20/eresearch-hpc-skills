import math
import re
from urllib.parse import urlparse

from django.core.exceptions import ValidationError

BLOCK_ID = re.compile(r"^[a-z][a-z0-9-]{0,63}$")
BLOCK_TYPES = {"typst", "callout", "bash"}
CALLOUT_STYLES = {"note", "hint", "warning", "exercise", "solution"}
BASH_MODES = {"display", "copy", "run"}


def validate_blocks(blocks):
    if not isinstance(blocks, list) or not blocks:
        raise ValidationError("Content needs at least one block.")
    ids = set()
    for index, block in enumerate(blocks, 1):
        if not isinstance(block, dict):
            raise ValidationError(f"Block {index} must be an object.")
        block_id = block.get("id", "")
        if not isinstance(block_id, str) or not BLOCK_ID.fullmatch(block_id):
            raise ValidationError(f"Block {index} has an invalid stable ID.")
        if block_id in ids:
            raise ValidationError(f'Duplicate block ID "{block_id}".')
        ids.add(block_id)
        kind = block.get("type")
        if kind not in BLOCK_TYPES:
            raise ValidationError(f'Block "{block_id}" has an unknown type.')
        if kind in {"typst", "callout"} and not isinstance(block.get("source"), str):
            raise ValidationError(f'Block "{block_id}" needs Typst source.')
        if kind == "callout" and block.get("style") not in CALLOUT_STYLES:
            raise ValidationError(f'Block "{block_id}" has an unknown callout style.')
        if kind == "bash":
            if not isinstance(block.get("command"), str) or not block["command"].strip():
                raise ValidationError(f'Block "{block_id}" needs a command.')
            if not isinstance(block.get("output", ""), str):
                raise ValidationError(f'Block "{block_id}" output must be text.')
            if block.get("mode") not in BASH_MODES:
                raise ValidationError(f'Block "{block_id}" has an unknown Bash mode.')


def validate_source(source):
    if not isinstance(source, dict):
        raise ValidationError("Source metadata must be an object.")
    url = source.get("url")
    if url and urlparse(url).scheme not in {"http", "https"}:
        raise ValidationError("Source URL must use HTTP or HTTPS.")


def validate_graph(graph, challenge_numbers=None, topic_keys=None):
    if not isinstance(graph, dict):
        raise ValidationError("Graph must be an object.")
    nodes = graph.get("nodes")
    connections = graph.get("connections", [])
    layouts = graph.get("layouts", {})
    if not isinstance(nodes, list) or not nodes:
        raise ValidationError("Graph needs at least one node.")

    numbers = []
    topics = {}
    for node in nodes:
        if not isinstance(node, dict) or not isinstance(node.get("number"), str) or not isinstance(node.get("topic"), str):
            raise ValidationError("Every graph node needs a challenge number and Topic key.")
        number = node["number"]
        numbers.append(number)
        topics[number] = node["topic"]
    if len(numbers) != len(set(numbers)):
        raise ValidationError("Graph challenge numbers must be unique.")
    if challenge_numbers is not None and not set(numbers) <= set(challenge_numbers):
        raise ValidationError("Graph references an unknown challenge.")
    if topic_keys is not None and not set(topics.values()) <= set(topic_keys):
        raise ValidationError("Graph references an unknown Topic.")

    edges = set()
    parents = {number: [] for number in numbers}
    for edge in connections:
        if not isinstance(edge, dict):
            raise ValidationError("Every connection must be an object.")
        source, target = edge.get("source"), edge.get("target")
        if source not in parents or target not in parents:
            raise ValidationError("Connection references an unknown graph node.")
        if source == target:
            raise ValidationError("A challenge cannot connect to itself.")
        pair = (source, target)
        if pair in edges:
            raise ValidationError("Graph connections must be unique.")
        edges.add(pair)
        parents[target].append(source)

    visiting, visited = set(), set()
    def visit(number):
        if number in visiting:
            raise ValidationError("Recommended connections must not contain a cycle.")
        if number in visited:
            return
        visiting.add(number)
        for parent in parents[number]:
            visit(parent)
        visiting.remove(number)
        visited.add(number)
    for number in numbers:
        visit(number)

    if not isinstance(layouts, dict):
        raise ValidationError("Layouts must be an object.")
    allowed_views = {"journey", *set(topics.values())}
    for view, positions in layouts.items():
        if view not in allowed_views or not isinstance(positions, dict):
            raise ValidationError("Layout keys must be journey or a graph Topic.")
        allowed_nodes = set(numbers) if view == "journey" else {n for n, topic in topics.items() if topic == view}
        for number, point in positions.items():
            if number not in allowed_nodes or not isinstance(point, dict):
                raise ValidationError("Layout contains a node outside its view.")
            x, y = point.get("x"), point.get("y")
            if not all(isinstance(value, (int, float)) and math.isfinite(value) for value in (x, y)):
                raise ValidationError("Every manual position needs finite x and y coordinates.")

    return graph
