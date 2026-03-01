package com.datadictmanage.common.util;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * PageUtils — 分页结果包装工具
 *
 * 职责：
 *   统一分页接口的响应格式，包含当前页数据列表、总数量、页码等信息。
 *   配合 MyBatis-Plus 的 Page 对象使用。
 *
 * @param <T> 列表数据类型
 *
 * @layer Common Layer
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PageUtils<T> {

    /** 当前页码（从 1 开始） */
    private int page;

    /** 每页条数 */
    private int size;

    /** 总记录数 */
    private long total;

    /** 总页数 */
    private int totalPages;

    /** 当前页数据列表 */
    private List<T> list;

    /**
     * 构建分页结果
     *
     * @param page  当前页码
     * @param size  每页条数
     * @param total 总记录数
     * @param list  当前页数据
     */
    public static <T> PageUtils<T> of(int page, int size, long total, List<T> list) {
        int totalPages = size == 0 ? 0 : (int) Math.ceil((double) total / size);
        return new PageUtils<>(page, size, total, totalPages, list);
    }

    /**
     * 从 MyBatis-Plus Page 对象构建
     */
    public static <T> PageUtils<T> fromMpPage(com.baomidou.mybatisplus.extension.plugins.pagination.Page<T> mpPage) {
        return of(
            (int) mpPage.getCurrent(),
            (int) mpPage.getSize(),
            mpPage.getTotal(),
            mpPage.getRecords()
        );
    }

    /**
     * 是否为第一页
     */
    public boolean isFirst() {
        return page <= 1;
    }

    /**
     * 是否为最后一页
     */
    public boolean isLast() {
        return page >= totalPages;
    }
}
