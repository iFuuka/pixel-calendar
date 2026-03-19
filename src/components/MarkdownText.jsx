import React from 'react';

/**
 * Lightweight markdown-like renderer.
 * Supports: **bold**, *italic*, `code`, ~~strike~~, - [ ] / - [x] checklists.
 */
function renderLine(line, lineIndex, onToggleCheck) {
    // Checklist: - [ ] or - [x]
    const checkMatch = line.match(/^(\s*)-\s*\[([ xX])\]\s*(.*)/);
    if (checkMatch) {
        const checked = checkMatch[2] !== ' ';
        const text = checkMatch[3];
        return (
            <label key={lineIndex} className="md-check-line">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleCheck && onToggleCheck(lineIndex)}
                    className="md-checkbox"
                />
                <span className={checked ? 'md-check-done' : ''}>{renderInline(text)}</span>
            </label>
        );
    }

    return <span key={lineIndex}>{renderInline(line)}</span>;
}

function renderInline(text) {
    // Process inline formatting
    const parts = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
        // Bold **text**
        const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
        // Italic *text*
        const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/);
        // Code `text`
        const codeMatch = remaining.match(/`(.+?)`/);
        // Strikethrough ~~text~~
        const strikeMatch = remaining.match(/~~(.+?)~~/);

        // Find earliest match
        const matches = [
            boldMatch && { type: 'bold', match: boldMatch },
            italicMatch && { type: 'italic', match: italicMatch },
            codeMatch && { type: 'code', match: codeMatch },
            strikeMatch && { type: 'strike', match: strikeMatch },
        ].filter(Boolean).sort((a, b) => a.match.index - b.match.index);

        if (matches.length === 0) {
            parts.push(remaining);
            break;
        }

        const first = matches[0];
        const idx = first.match.index;

        if (idx > 0) {
            parts.push(remaining.slice(0, idx));
        }

        const inner = first.match[1];
        switch (first.type) {
            case 'bold':
                parts.push(<strong key={key++}>{inner}</strong>);
                break;
            case 'italic':
                parts.push(<em key={key++}>{inner}</em>);
                break;
            case 'code':
                parts.push(<code key={key++} className="md-inline-code">{inner}</code>);
                break;
            case 'strike':
                parts.push(<del key={key++}>{inner}</del>);
                break;
        }

        remaining = remaining.slice(idx + first.match[0].length);
    }

    return parts;
}

export default function MarkdownText({ text, onToggleCheck }) {
    if (!text) return null;

    const lines = text.split('\n');

    return (
        <span className="md-text">
            {lines.map((line, i) => (
                <React.Fragment key={i}>
                    {i > 0 && <br />}
                    {renderLine(line, i, onToggleCheck)}
                </React.Fragment>
            ))}
        </span>
    );
}
