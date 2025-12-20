import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const TEMPLATES_DIR = resolve(import.meta.dir, "../../../templates");

// Simple template cache
const templateCache = new Map<string, string>();

// Load a template file
function loadTemplate(name: string): string {
  if (templateCache.has(name)) {
    return templateCache.get(name)!;
  }

  const path = resolve(TEMPLATES_DIR, name);
  if (!existsSync(path)) {
    throw new Error(`Template not found: ${name}`);
  }

  const content = readFileSync(path, "utf-8");
  templateCache.set(name, content);
  return content;
}

// Process includes like {% include '_sidebar.html' %}
function processIncludes(template: string): string {
  const includeRegex = /\{%\s*include\s+['"]([^'"]+)['"]\s*%\}/g;
  
  return template.replace(includeRegex, (_, includePath) => {
    try {
      const includeContent = loadTemplate(includePath);
      return processIncludes(includeContent); // Recursive for nested includes
    } catch {
      return `<!-- Include not found: ${includePath} -->`;
    }
  });
}

// Simple variable replacement {{ variable }}
function replaceVariables(template: string, context: Record<string, any>): string {
  return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, expr) => {
    const trimmed = expr.trim();
    
    // Handle simple property access like user.username
    const parts = trimmed.split(".");
    let value: any = context;
    
    for (const part of parts) {
      if (value === null || value === undefined) return "";
      value = value[part];
    }
    
    if (value === null || value === undefined) return "";
    return escapeHtml(String(value));
  });
}

// Escape HTML to prevent XSS
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Process simple conditionals {% if condition %}...{% endif %}
function processConditionals(template: string, context: Record<string, any>): string {
  // Handle {% if condition %}...{% else %}...{% endif %}
  const ifElseRegex = /\{%\s*if\s+([^%]+)\s*%\}([\s\S]*?)\{%\s*else\s*%\}([\s\S]*?)\{%\s*endif\s*%\}/g;
  template = template.replace(ifElseRegex, (_, condition, ifBlock, elseBlock) => {
    const result = evaluateCondition(condition.trim(), context);
    return result ? ifBlock : elseBlock;
  });

  // Handle {% if condition %}...{% endif %} (no else)
  const ifRegex = /\{%\s*if\s+([^%]+)\s*%\}([\s\S]*?)\{%\s*endif\s*%\}/g;
  template = template.replace(ifRegex, (_, condition, block) => {
    const result = evaluateCondition(condition.trim(), context);
    return result ? block : "";
  });

  return template;
}

// Evaluate a simple condition
function evaluateCondition(condition: string, context: Record<string, any>): boolean {
  // Handle session.get('key')
  const sessionGetMatch = condition.match(/session\.get\(['"]([^'"]+)['"](,\s*([^)]+))?\)/);
  if (sessionGetMatch) {
    const key = sessionGetMatch[1];
    return !!context.session?.[key];
  }

  // Handle request.path == '/path'
  const pathMatch = condition.match(/request\.path\s*==\s*['"]([^'"]+)['"]/);
  if (pathMatch) {
    return context.request?.path === pathMatch[1];
  }

  // Handle simple variable check
  const parts = condition.split(".");
  let value: any = context;
  for (const part of parts) {
    if (value === null || value === undefined) return false;
    value = value[part];
  }
  
  return !!value;
}

// Process for loops {% for item in items %}...{% endfor %}
function processLoops(template: string, context: Record<string, any>): string {
  const forRegex = /\{%\s*for\s+(\w+)\s+in\s+([^%]+)\s*%\}([\s\S]*?)\{%\s*endfor\s*%\}/g;
  
  return template.replace(forRegex, (_, itemName, listExpr, block) => {
    const listPath = listExpr.trim().split(".");
    let list: any = context;
    
    for (const part of listPath) {
      if (list === null || list === undefined) return "";
      list = list[part];
    }
    
    if (!Array.isArray(list)) return "";
    
    return list.map((item) => {
      const itemContext = { ...context, [itemName]: item };
      let processed = processConditionals(block, itemContext);
      processed = replaceVariables(processed, itemContext);
      return processed;
    }).join("");
  });
}

// Main render function
export function render(templateName: string, context: Record<string, any> = {}): string {
  let template = loadTemplate(templateName);
  
  // Process in order: includes, loops, conditionals, variables
  template = processIncludes(template);
  template = processLoops(template, context);
  template = processConditionals(template, context);
  template = replaceVariables(template, context);
  
  return template;
}

// Clear template cache (useful for development)
export function clearTemplateCache(): void {
  templateCache.clear();
}
