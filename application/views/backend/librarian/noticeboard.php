<style>
/* Direct UI/UX rebuild — Librarian Noticeboard */
.librarian-noticeboard {
    margin: 0 !important;
    padding: 24px 28px 40px;
    background: #f8fafc;
    min-height: 100%;
}
.librarian-noticeboard-head {
    margin: 0 0 18px;
    padding-bottom: 18px;
    border-bottom: 1px solid #e2e8f0;
}
.librarian-noticeboard-eyebrow {
    margin: 0 0 4px;
    color: #2563eb;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: .08em;
    text-transform: uppercase;
}
.librarian-noticeboard-head h1 {
    margin: 0;
    color: #0f172a;
    font-size: 30px;
    line-height: 1.2;
    font-weight: 800;
    letter-spacing: -.02em;
}
.librarian-noticeboard-head p:last-child {
    margin: 7px 0 0;
    color: #64748b;
    font-size: 15px;
    line-height: 1.5;
}
.librarian-noticeboard-shell {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    background: #fff;
    box-shadow: 0 1px 2px rgba(15,23,42,.05);
}
#table_export {
    width: 100% !important;
    min-width: 850px;
    margin: 0 !important;
    border: 0 !important;
}
#table_export thead th {
    padding: 12px 13px !important;
    background: #f8fafc !important;
    color: #475569 !important;
    font-size: 13px !important;
    line-height: 1.35;
    font-weight: 800 !important;
    letter-spacing: .035em;
    vertical-align: middle;
    border-bottom: 1px solid #e2e8f0 !important;
}
#table_export tbody td {
    padding: 12px 13px !important;
    color: #334155 !important;
    font-size: 14px !important;
    line-height: 1.5;
    vertical-align: middle;
    border-bottom: 1px solid #eef2f7 !important;
}
#table_export tbody tr:hover td { background: #f8fbff; }
#table_export td.span5 {
    min-width: 320px;
    max-width: 520px;
    white-space: normal !important;
}
#table_export .btn {
    min-height: 38px;
    padding: 8px 12px !important;
    border-radius: 8px !important;
    font-size: 13px !important;
    font-weight: 800 !important;
    white-space: nowrap;
}
.librarian-noticeboard-shell .dataTables_wrapper {
    min-width: 850px;
    padding: 14px;
}
.librarian-noticeboard-shell .dataTables_length,
.librarian-noticeboard-shell .dataTables_filter,
.librarian-noticeboard-shell .dataTables_info,
.librarian-noticeboard-shell .dataTables_paginate {
    color: #475569;
    font-size: 14px;
}
.librarian-noticeboard-shell .dataTables_length select,
.librarian-noticeboard-shell .dataTables_filter input[type="search"] {
    min-height: 40px;
    padding: 8px 10px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    background: #fff;
    color: #0f172a;
    font-size: 14px;
}
.librarian-notice-empty {
    padding: 36px 18px !important;
    color: #64748b !important;
    text-align: center;
}
@media (max-width: 767px) {
    .librarian-noticeboard { padding: 18px 14px 32px; }
    .librarian-noticeboard-head h1 { font-size: 26px; }
    .librarian-noticeboard-shell .dataTables_filter {
        float: none;
        text-align: left;
        margin-top: 10px;
    }
    .librarian-noticeboard-shell .dataTables_filter input[type="search"] {
        width: 220px;
        max-width: calc(100vw - 86px);
        font-size: 16px;
    }
}
</style>

<div class="librarian-noticeboard">
    <div class="librarian-noticeboard-head">
        <p class="librarian-noticeboard-eyebrow">Communication</p>
        <h1><?php echo get_phrase('noticeboard_list'); ?></h1>
        <p>Read school notices and open full announcements without losing the context of the notice register.</p>
    </div>

    <div class="librarian-noticeboard-shell">
        <table cellpadding="0" cellspacing="0" border="0" class="table table-bordered datatable" id="table_export">
            <thead>
                <tr>
                    <th><div>#</div></th>
                    <th><div><?php echo get_phrase('title'); ?></div></th>
                    <th><div><?php echo get_phrase('notice'); ?></div></th>
                    <th><div><?php echo get_phrase('date'); ?></div></th>
                    <th><div><?php echo get_phrase('options'); ?></div></th>
                </tr>
            </thead>
            <tbody>
                <?php $count = 1; ?>
                <?php foreach ($notices as $row): ?>
                    <tr>
                        <td><?php echo $count++; ?></td>
                        <td><strong><?php echo $row['notice_title']; ?></strong></td>
                        <td class="span5"><?php echo $row['notice']; ?></td>
                        <td><?php echo date('d M, Y', $row['create_timestamp']); ?></td>
                        <td>
                            <a href="#" onclick="showAjaxModal('<?php echo site_url('modal/popup/modal_view_notice/'.$row['notice_id']); ?>'); return false;"
                               class="btn btn-info">
                                <i class="entypo-eye"></i> <?php echo get_phrase('view_notice'); ?>
                            </a>
                        </td>
                    </tr>
                <?php endforeach; ?>
                <?php if (empty($notices)): ?>
                    <tr>
                        <td colspan="5" class="librarian-notice-empty"><?php echo get_phrase('no_data_found'); ?></td>
                    </tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>