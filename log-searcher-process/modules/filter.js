function createNode() {
    return {
        text: null,
        negation: null,
        action: null,
        left: null,
        right: null
    }
}

function parseFilter(str, negation) {
    str = str.trim();
    let node = createNode();
    let minus = negation || null;
    let braceNegation = null;
    let index;
    for (let i = 0; i < str.length; i++) {
        if (str[i] === "-") {
            minus = true;
        } else {
            index = i;
            if (str[i] === "(") {
                i = str.indexOf(")", i);
                if (i == -1) {
                    throw new Error("filter error")
                }
                if (i === str.length - 1) {
                    str = str.substring(index + 1, i);
                    i = -1;
                    braceNegation = minus;
                    minus = null;
                    continue
                }
            } else if (str[i] === '"' || str[i] === "'") {
                let char = str[i];
                i = str.indexOf(char, ++i);
                if (i == -1) {
                    throw new Error("filter error")
                }
                if (i == str.length - 1) {
                    node.text = str.substring(index + 1, i);
                    node.negation = minus;
                    break;
                }
            } else if (str[i] != " ") {
                while (str[i] != " " && i < str.length) {
                    i++;
                }
                if (i == str.length) {
                    node.text = str.substr(index);
                    node.negation = braceNegation || minus;
                    break;
                }
                i--;
            }
            node.left = parseFilter(str.substring(index, i + 1), minus);
            i += 2;
            if (str[i] == " ") {
                while (str[i] == " " && str[i] < str.length) {
                    i++;
                }
            }
            node.action = (str[i] == "O" && str[i + 1] == "R") ? "||" : "&&";
            let offset = (str[i] == "O" && str[i + 1] == "R") ? 3 : 0;
            node.right = parseFilter(str.substr(i + offset), null);
            node.negation = braceNegation;
            break;
        }
    }
    return node;
}

function checkString(node, str) {
    let result;
    if (node.text) {
        result = str.includes(node.text);
    }
    if (node.action == "&&") {
        result = checkString(node.left, str) && checkString(node.right, str);
    } else if (node.action == "||") {
        result = checkString(node.left, str) || checkString(node.right, str);
    }
    return node.negation ? !result : result;
}

module.exports = function createFilter(filter) {
    let root = parseFilter(filter);

    return line => checkString(root, line);
};