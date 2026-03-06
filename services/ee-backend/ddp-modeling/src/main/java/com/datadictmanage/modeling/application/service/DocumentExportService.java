package com.datadictmanage.modeling.application.service;

import com.datadictmanage.modeling.domain.model.ModelBO;
import com.datadictmanage.modeling.domain.model.EntityBO;
import com.datadictmanage.modeling.domain.model.FieldBO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * DocumentExportService — 文档导出服务
 *
 * 支持导出格式：
 * - Word (.docx)
 * - Excel (.xlsx)
 * - HTML
 * - Markdown
 *
 * @layer Application Layer
 * @module ddp-modeling
 */
@Slf4j
@Service
public class DocumentExportService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    // ── Word 导出 ─────────────────────────────────────────────────

    /**
     * 导出为 Word 文档
     * Phase 1: 返回 HTML 格式（可另存为 Word）
     * 生产版: 使用 docx4j 或 POI
     */
    public byte[] exportToWord(ModelBO model) {
        StringBuilder html = new StringBuilder();
        
        html.append("<html xmlns:o='urn:schemas-microsoft-com:office:office' ");
        html.append("xmlns:w='urn:schemas-microsoft-com:office:word' ");
        html.append("xmlns='http://www.w3.org/TR/REC-html40'>");
        html.append("<head><meta charset='utf-8'><title>").append(model.getName()).append("</title>");
        html.append("<style>");
        html.append("body { font-family: 'SimSun', sans-serif; font-size: 12pt; }");
        html.append("h1 { color: #1e3a8a; font-size: 18pt; }");
        html.append("h2 { color: #1e40af; font-size: 14pt; border-bottom: 1px solid #ccc; }");
        html.append("table { border-collapse: collapse; width: 100%; margin-bottom: 20pt; }");
        html.append("th, td { border: 1px solid #666; padding: 8pt; text-align: left; }");
        html.append("th { background-color: #f0f7ff; }");
        html.append(".table-name { font-weight: bold; color: #1d4ed8; }");
        html.append(".field-pk { background-color: #fef9c3; }");
        html.append(".field-comment { color: #6b7280; font-size: 10pt; }");
        html.append("</style></head><body>");

        // 标题
        html.append("<h1>").append(model.getName()).append("</h1>");
        if (model.getDescription() != null && !model.getDescription().isBlank()) {
            html.append("<p>").append(model.getDescription()).append("</p>");
        }
        html.append("<p>导出时间: ").append(LocalDateTime.now().format(DATE_FORMATTER)).append("</p>");

        // 数据表
        if (model.getEntities() != null) {
            for (EntityBO entity : model.getEntities()) {
                html.append("<h2>").append(entity.getName());
                if (entity.getComment() != null && !entity.getComment().isBlank()) {
                    html.append(" - ").append(entity.getComment());
                }
                html.append("</h2>");

                html.append("<table>");
                html.append("<tr><th>序号</th><th>字段名</th><th>类型</th><th>可空</th><th>主键</th><th>自增</th><th>默认值</th><th>说明</th></tr>");

                int index = 1;
                for (FieldBO field : entity.getFields()) {
                    String rowClass = field.isPrimaryKey() ? "field-pk" : "";
                    html.append("<tr class='").append(rowClass).append("'>");
                    html.append("<td>").append(index++).append("</td>");
                    html.append("<td><strong>").append(field.getName()).append("</strong></td>");
                    html.append("<td>").append(formatFieldType(field)).append("</td>");
                    html.append("<td>").append(field.isNullable() ? "是" : "否").append("</td>");
                    html.append("<td>").append(field.isPrimaryKey() ? "✓" : "").append("</td>");
                    html.append("<td>").append(field.isAutoIncrement() ? "✓" : "").append("</td>");
                    html.append("<td>").append(field.getDefaultValue() != null ? field.getDefaultValue() : "").append("</td>");
                    html.append("<td class='field-comment'>").append(field.getComment() != null ? field.getComment() : "").append("</td>");
                    html.append("</tr>");
                }
                html.append("</table>");
            }
        }

        html.append("</body></html>");

        return html.toString().getBytes(StandardCharsets.UTF_8);
    }

    // ── Excel 导出 ─────────────────────────────────────────────────

    /**
     * 导出为 Excel 文档
     * Phase 1: 返回 CSV 格式
     * 生产版: 使用 Apache POI
     */
    public byte[] exportToExcel(ModelBO model) {
        StringBuilder csv = new StringBuilder();

        // Sheet 1: 数据表清单
        csv.append("数据表清单\n");
        csv.append("序号,表名,表说明,字段数,创建时间\n");
        
        if (model.getEntities() != null) {
            int index = 1;
            for (EntityBO entity : model.getEntities()) {
                csv.append(index++).append(",");
                csv.append(escapeCsv(entity.getName())).append(",");
                csv.append(escapeCsv(entity.getComment())).append(",");
                csv.append(entity.getFields() != null ? entity.getFields().size() : 0).append(",");
                csv.append("\n");
            }
        }

        // Sheet 2: 字段详情
        csv.append("\n字段清单\n");
        csv.append("序号,表名,字段名,类型,长度,精度,可空,主键,自增,默认值,说明\n");

        if (model.getEntities() != null) {
            int index = 1;
            for (EntityBO entity : model.getEntities()) {
                if (entity.getFields() != null) {
                    for (FieldBO field : entity.getFields()) {
                        csv.append(index++).append(",");
                        csv.append(escapeCsv(entity.getName())).append(",");
                        csv.append(escapeCsv(field.getName())).append(",");
                        csv.append(escapeCsv(field.getBaseType())).append(",");
                        csv.append(field.getLength() != null ? field.getLength() : "").append(",");
                        csv.append(field.getPrecision() != null ? field.getPrecision() : "").append(",");
                        csv.append(field.isNullable() ? "是" : "否").append(",");
                        csv.append(field.isPrimaryKey() ? "✓" : "").append(",");
                        csv.append(field.isAutoIncrement() ? "✓" : "").append(",");
                        csv.append(escapeCsv(field.getDefaultValue())).append(",");
                        csv.append(escapeCsv(field.getComment())).append("\n");
                    }
                }
            }
        }

        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    // ── HTML 导出 ─────────────────────────────────────────────────

    /**
     * 导出为 HTML 文档
     */
    public byte[] exportToHtml(ModelBO model) {
        return exportToWord(model); // Word HTML 格式兼容
    }

    // ── Markdown 导出 ─────────────────────────────────────────────────

    /**
     * 导出为 Markdown 文档
     */
    public byte[] exportToMarkdown(ModelBO model) {
        StringBuilder md = new StringBuilder();

        // 标题
        md.append("# ").append(model.getName()).append("\n\n");
        if (model.getDescription() != null && !model.getDescription().isBlank()) {
            md.append(model.getDescription()).append("\n\n");
        }
        md.append("> 导出时间: ").append(LocalDateTime.now().format(DATE_FORMATTER)).append("\n\n");

        // 数据表
        if (model.getEntities() != null) {
            md.append("---\n\n");
            
            for (EntityBO entity : model.getEntities()) {
                md.append("## ").append(entity.getName());
                if (entity.getComment() != null && !entity.getComment().isBlank()) {
                    md.append(" - ").append(entity.getComment());
                }
                md.append("\n\n");

                // 字段表
                md.append("| 序号 | 字段名 | 类型 | 可空 | 主键 | 说明 |\n");
                md.append("| --- | --- | --- | --- | --- | --- |\n");

                int index = 1;
                if (entity.getFields() != null) {
                    for (FieldBO field : entity.getFields()) {
                        md.append("| ").append(index++).append(" | ");
                        md.append("**").append(field.getName()).append("** | ");
                        md.append(formatFieldType(field)).append(" | ");
                        md.append(field.isNullable() ? "✓" : "✗").append(" | ");
                        md.append(field.isPrimaryKey() ? "🔑" : "").append(" | ");
                        md.append(field.getComment() != null ? field.getComment() : "").append(" |\n");
                    }
                }
                md.append("\n");
            }
        }

        return md.toString().getBytes(StandardCharsets.UTF_8);
    }

    // ── 辅助方法 ─────────────────────────────────────────────────

    private String formatFieldType(FieldBO field) {
        StringBuilder type = new StringBuilder(field.getBaseType() != null ? field.getBaseType() : "VARCHAR");
        
        if (field.getLength() != null && field.getLength() > 0) {
            type.append("(").append(field.getLength());
            if (field.getScale() != null && field.getScale() > 0) {
                type.append(",").append(field.getScale());
            }
            type.append(")");
        } else if (field.getPrecision() != null) {
            type.append("(").append(field.getPrecision());
            if (field.getScale() != null && field.getScale() > 0) {
                type.append(",").append(field.getScale());
            }
            type.append(")");
        }
        
        return type.toString();
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
