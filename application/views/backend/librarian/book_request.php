<style>
/* Direct UI/UX rebuild — Librarian Book Requests */
.library-requests-workspace {
    margin: 0 !important;
    padding: 24px 28px 40px;
    background: #f8fafc;
    min-height: 100%;
}
.library-requests-page-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 18px;
    margin: 0 0 18px;
    padding-bottom: 18px;
    border-bottom: 1px solid #e2e8f0;
}
.library-requests-eyebrow {
    margin: 0 0 4px;
    color: #2563eb;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: .08em;
    text-transform: uppercase;
}
.library-requests-page-head h1 {
    margin: 0;
    color: #0f172a;
    font-size: 30px;
    line-height: 1.2;
    font-weight: 800;
    letter-spacing: -.02em;
}
.library-requests-page-head p:last-child {
    margin: 7px 0 0;
    color: #64748b;
    font-size: 15px;
    line-height: 1.5;
}
.library-request-stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 16px;
}
.library-request-stat {
    padding: 15px 16px;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    background: #fff;
    box-shadow: 0 1px 2px rgba(15,23,42,.04);
}
.library-request-stat span {
    display: block;
    margin-bottom: 5px;
    color: #64748b;
    font-size: 12px;
    line-height: 1.3;
    font-weight: 800;
    letter-spacing: .055em;
    text-transform: uppercase;
}
.library-request-stat strong {
    display: block;
    color: #0f172a;
    font-size: 24px;
    line-height: 1.1;
    font-weight: 800;
}
.library-requests-table-shell {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding: 0;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    background: #fff;
    box-shadow: 0 1px 2px rgba(15,23,42,.05);
}
#table_export {
    width: 100% !important;
    min-width: 1060px;
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
    line-height: 1.45;
    vertical-align: middle;
    border-bottom: 1px solid #eef2f7 !important;
}
#table_export tbody tr:hover td { background: #f8fbff; }
.library-requests-table-shell .dataTables_wrapper {
    min-width: 1060px;
    padding: 14px;
}
.library-requests-table-shell .dataTables_length,
.library-requests-table-shell .dataTables_filter,
.library-requests-table-shell .dataTables_info,
.library-requests-table-shell .dataTables_paginate {
    color: #475569;
    font-size: 14px;
}
.library-requests-table-shell .dataTables_length select,
.library-requests-table-shell .dataTables_filter input[type="search"] {
    min-height: 40px;
    padding: 8px 10px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    background: #fff;
    color: #0f172a;
    font-size: 14px;
}
.library-request-status {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 28px;
    padding: 5px 10px;
    border-radius: 999px;
    font-size: 12px;
    line-height: 1;
    font-weight: 800;
    white-space: nowrap;
}
.library-request-status.pending { background: #eff6ff; color: #1d4ed8; }
.library-request-status.issued { background: #ecfdf5; color: #047857; }
.library-request-status.rejected { background: #fef2f2; color: #b91c1c; }
.library-request-status.overdue { background: #fff7ed; color: #c2410c; }
.library-request-actions .btn {
    min-height: 36px;
    padding: 7px 11px !important;
    border-radius: 8px !important;
    font-size: 13px !important;
    font-weight: 800 !important;
}
.library-request-actions .dropdown-menu {
    min-width: 150px;
    padding: 6px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    box-shadow: 0 12px 28px rgba(15,23,42,.12);
}
.library-request-actions .dropdown-menu > li > a {
    padding: 9px 10px;
    border-radius: 7px;
    font-size: 13px;
    font-weight: 700;
}
.library-request-empty {
    padding: 36px 18px !important;
    color: #64748b !important;
    text-align: center;
}
@media (max-width: 991px) {
    .library-request-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 767px) {
    .library-requests-workspace { padding: 18px 14px 32px; }
    .library-requests-page-head { display: block; }
    .library-requests-page-head h1 { font-size: 26px; }
    .library-request-stats { grid-template-columns: 1fr 1fr; gap: 9px; }
    .library-request-stat { padding: 13px; }
    .library-request-stat strong { font-size: 21px; }
    .library-requests-table-shell .dataTables_filter {
        float: none;
        text-align: left;
        margin-top: 10px;
    }
    .library-requests-table-shell .dataTables_filter input[type="search"] {
        width: 220px;
        max-width: calc(100vw - 86px);
        font-size: 16px;
    }
}
</style>

<?php
$this->db->order_by('book_request_id', 'desc');
$book_requests = $this->db->get('book_request')->result_array();

$request_counts = array(
    'all' => count($book_requests),
    'pending' => 0,
    'issued' => 0,
    'overdue' => 0
);
$today_timestamp = strtotime(date('Y-m-d'));

foreach ($book_requests as $request_row) {
    if ((int) $request_row['status'] === 0) {
        $request_counts['pending']++;
    } elseif ((int) $request_row['status'] === 1) {
        $request_counts['issued']++;
        $request_end_timestamp = strtotime(date('Y-m-d', $request_row['issue_end_date']));
        if ($today_timestamp > $request_end_timestamp) {
            $request_counts['overdue']++;
        }
    }
}
?>

<div class="library-requests-workspace">
    <div class="library-requests-page-head">
        <div>
            <p class="library-requests-eyebrow">Library</p>
            <h1><?php echo get_phrase('book_request'); ?></h1>
            <p>Review student requests, issue available books and keep overdue circulation visible from one queue.</p>
        </div>
    </div>

    <div class="library-request-stats">
        <div class="library-request-stat">
            <span>All requests</span>
            <strong><?php echo number_format($request_counts['all']); ?></strong>
        </div>
        <div class="library-request-stat">
            <span>Pending</span>
            <strong><?php echo number_format($request_counts['pending']); ?></strong>
        </div>
        <div class="library-request-stat">
            <span>Issued</span>
            <strong><?php echo number_format($request_counts['issued']); ?></strong>
        </div>
        <div class="library-request-stat">
            <span>Overdue</span>
            <strong><?php echo number_format($request_counts['overdue']); ?></strong>
        </div>
    </div>

    <div class="library-requests-table-shell">
        <table class="table table-bordered table-striped datatable" id="table_export">
            <thead>
                <tr>
                    <th style="width: 60px;">#</th>
                    <th><?php echo get_phrase('requested_book');?></th>
                    <th><?php echo get_phrase('requested_by');?></th>
                    <th><?php echo get_phrase('issue_starting_date');?></th>
                    <th><?php echo get_phrase('issue_ending_date');?></th>
                    <th><?php echo get_phrase('request_status');?></th>
                    <th><?php echo get_phrase('options');?></th>
                </tr>
            </thead>
            <tbody>
                <?php
                $count = 1;
                foreach ($book_requests as $row) {
                    $end_timestamp = strtotime(date('Y-m-d', $row['issue_end_date']));
                    $book_row = $this->db->get_where('book', array('book_id' => $row['book_id']))->row();
                    $student_row = $this->db->get_where('student', array('student_id' => $row['student_id']))->row();

                    if ($today_timestamp > $end_timestamp && (int) $row['status'] === 1) {
                        $status_label = get_phrase('overdue');
                        $status_class = 'overdue';
                    } elseif ((int) $row['status'] === 0) {
                        $status_label = get_phrase('pending');
                        $status_class = 'pending';
                    } elseif ((int) $row['status'] === 1) {
                        $status_label = get_phrase('issued');
                        $status_class = 'issued';
                    } else {
                        $status_label = get_phrase('rejected');
                        $status_class = 'rejected';
                    }
                ?>
                    <tr>
                        <td><?php echo $count++; ?></td>
                        <td><?php echo $book_row ? html_escape($book_row->name) : '&mdash;'; ?></td>
                        <td><?php echo $student_row ? html_escape($student_row->name) : '&mdash;'; ?></td>
                        <td><?php echo date('d/m/Y', $row['issue_start_date']); ?></td>
                        <td><?php echo date('d/m/Y', $row['issue_end_date']); ?></td>
                        <td>
                            <span class="library-request-status <?php echo $status_class; ?>">
                                <?php echo $status_label; ?>
                            </span>
                        </td>
                        <td class="library-request-actions">
                            <?php if ((int) $row['status'] === 0) { ?>
                                <div class="btn-group">
                                    <button type="button" class="btn btn-info btn-sm dropdown-toggle" data-toggle="dropdown">
                                        <?php echo get_phrase('action'); ?> <span class="caret"></span>
                                    </button>
                                    <ul class="dropdown-menu dropdown-default pull-right" role="menu">
                                        <li>
                                            <a href="<?php echo site_url('librarian/book_request/accept/'.$row['book_request_id']);?>" style="color: #047857;">
                                                <i class="entypo-check"></i>
                                                <?php echo get_phrase('accept');?>
                                            </a>
                                        </li>
                                        <li>
                                            <a href="<?php echo site_url('librarian/book_request/reject/'.$row['book_request_id']);?>" style="color: #b91c1c;">
                                                <i class="entypo-cancel"></i>
                                                <?php echo get_phrase('reject');?>
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                            <?php } else { ?>
                                <span class="text-muted"><?php echo get_phrase('no_actions_available'); ?></span>
                            <?php } ?>
                        </td>
                    </tr>
                <?php } ?>
                <?php if (empty($book_requests)) { ?>
                    <tr>
                        <td colspan="7" class="library-request-empty">
                            <?php echo get_phrase('no_data_found'); ?>
                        </td>
                    </tr>
                <?php } ?>
            </tbody>
        </table>
    </div>
</div>

<script type="text/javascript">
jQuery(document).ready(function($)
{
    $("#table_export").dataTable();
});
</script>