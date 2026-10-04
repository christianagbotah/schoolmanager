<?php
$pending_book_requests = $this->db->get_where('book_request', array('status' => 0))->num_rows();

$this->db->select_sum('total_copies', 'total_copies');
$query = $this->db->get('book');
$result = $query->result();
$total_copies = isset($result[0]->total_copies) ? (int) $result[0]->total_copies : 0;

$this->db->select_sum('issued_copies', 'issued_copies');
$query = $this->db->get('book');
$result = $query->result();
$issued_copies = isset($result[0]->issued_copies) ? (int) $result[0]->issued_copies : 0;

$total_books = (int) $this->db->count_all('book');
$available_copies = max(0, $total_copies - $issued_copies);
?>

<style>
/* Direct UI/UX rebuild — Librarian Dashboard */
.librarian-dashboard {
    margin: 0 !important;
    padding: 24px 28px 40px;
    background: #f8fafc;
    min-height: 100%;
}
.librarian-dashboard-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 20px;
    padding-bottom: 18px;
    border-bottom: 1px solid #e2e8f0;
}
.librarian-dashboard-eyebrow {
    margin: 0 0 4px;
    color: #2563eb;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: .08em;
    text-transform: uppercase;
}
.librarian-dashboard-head h1 {
    margin: 0;
    color: #0f172a;
    font-size: 30px;
    line-height: 1.2;
    font-weight: 800;
    letter-spacing: -.02em;
}
.librarian-dashboard-head p:last-child {
    margin: 7px 0 0;
    color: #64748b;
    font-size: 15px;
    line-height: 1.5;
}
.librarian-dashboard-actions {
    display: flex;
    gap: 9px;
    flex-wrap: wrap;
}
.librarian-dashboard-actions .btn {
    min-height: 44px;
    padding: 10px 15px !important;
    border-radius: 9px !important;
    font-size: 14px !important;
    font-weight: 800 !important;
}
.librarian-dashboard-actions .btn-primary {
    background: #2563eb !important;
    border-color: #2563eb !important;
}
.librarian-dashboard-actions .btn-default {
    background: #fff !important;
    border-color: #cbd5e1 !important;
    color: #334155 !important;
}
.librarian-kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 18px;
}
.librarian-kpi {
    min-height: 142px;
    padding: 18px;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    background: #fff;
    box-shadow: 0 1px 2px rgba(15,23,42,.05);
}
.librarian-kpi-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 20px;
}
.librarian-kpi-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border-radius: 11px;
    background: #eff6ff;
    color: #2563eb;
    font-size: 20px;
}
.librarian-kpi-label {
    color: #64748b;
    font-size: 13px;
    line-height: 1.35;
    font-weight: 800;
    letter-spacing: .035em;
    text-transform: uppercase;
}
.librarian-kpi-value {
    color: #0f172a;
    font-size: 31px;
    line-height: 1;
    font-weight: 800;
    letter-spacing: -.025em;
}
.librarian-kpi-note {
    margin-top: 8px;
    color: #64748b;
    font-size: 13px;
    line-height: 1.4;
}
.librarian-dashboard-panel {
    padding: 18px;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    background: #fff;
    box-shadow: 0 1px 2px rgba(15,23,42,.05);
}
.librarian-dashboard-panel h3 {
    margin: 0 0 6px;
    color: #0f172a;
    font-size: 18px;
    font-weight: 800;
}
.librarian-dashboard-panel p {
    margin: 0 0 15px;
    color: #64748b;
    font-size: 14px;
    line-height: 1.5;
}
.librarian-circulation-meter {
    overflow: hidden;
    height: 10px;
    margin: 12px 0 10px;
    border-radius: 999px;
    background: #e2e8f0;
}
.librarian-circulation-meter span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: #2563eb;
}
.librarian-circulation-meta {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    color: #475569;
    font-size: 13px;
    font-weight: 700;
}
@media (max-width: 1100px) {
    .librarian-kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 767px) {
    .librarian-dashboard { padding: 18px 14px 32px; }
    .librarian-dashboard-head { display: block; }
    .librarian-dashboard-head h1 { font-size: 26px; }
    .librarian-dashboard-actions { margin-top: 15px; }
    .librarian-dashboard-actions .btn { flex: 1 1 150px; }
    .librarian-kpi-grid { grid-template-columns: 1fr; gap: 10px; }
    .librarian-kpi { min-height: 126px; }
}
</style>

<div class="librarian-dashboard">
    <div class="librarian-dashboard-head">
        <div>
            <p class="librarian-dashboard-eyebrow">Library Operations</p>
            <h1><?php echo get_phrase('librarian_dashboard'); ?></h1>
            <p>Track catalogue volume, circulation and pending requests, then jump directly into the work that needs attention.</p>
        </div>
        <div class="librarian-dashboard-actions">
            <a class="btn btn-primary" href="<?php echo site_url('librarian/book_request'); ?>">
                <i class="entypo-arrows-ccw"></i> <?php echo get_phrase('book_request'); ?>
            </a>
            <a class="btn btn-default" href="<?php echo site_url('librarian/book'); ?>">
                <i class="entypo-book"></i> <?php echo get_phrase('manage_library_books'); ?>
            </a>
        </div>
    </div>

    <div class="librarian-kpi-grid">
        <div class="librarian-kpi">
            <div class="librarian-kpi-top">
                <span class="librarian-kpi-label"><?php echo get_phrase('total_books'); ?></span>
                <span class="librarian-kpi-icon"><i class="entypo-book"></i></span>
            </div>
            <div class="librarian-kpi-value"><?php echo number_format($total_books); ?></div>
            <div class="librarian-kpi-note">Titles currently registered in the catalogue.</div>
        </div>

        <div class="librarian-kpi">
            <div class="librarian-kpi-top">
                <span class="librarian-kpi-label"><?php echo get_phrase('pending_requests'); ?></span>
                <span class="librarian-kpi-icon"><i class="entypo-arrows-ccw"></i></span>
            </div>
            <div class="librarian-kpi-value"><?php echo number_format($pending_book_requests); ?></div>
            <div class="librarian-kpi-note">Requests waiting for an accept or reject decision.</div>
        </div>

        <div class="librarian-kpi">
            <div class="librarian-kpi-top">
                <span class="librarian-kpi-label"><?php echo get_phrase('total_copies'); ?></span>
                <span class="librarian-kpi-icon"><i class="entypo-docs"></i></span>
            </div>
            <div class="librarian-kpi-value"><?php echo number_format($total_copies); ?></div>
            <div class="librarian-kpi-note"><?php echo number_format($available_copies); ?> copies currently not issued.</div>
        </div>

        <div class="librarian-kpi">
            <div class="librarian-kpi-top">
                <span class="librarian-kpi-label"><?php echo get_phrase('issued_copies'); ?></span>
                <span class="librarian-kpi-icon"><i class="entypo-check"></i></span>
            </div>
            <div class="librarian-kpi-value"><?php echo number_format($issued_copies); ?></div>
            <div class="librarian-kpi-note">Copies presently recorded as issued.</div>
        </div>
    </div>

    <?php $circulation_percent = $total_copies > 0 ? min(100, round(($issued_copies / $total_copies) * 100)) : 0; ?>
    <div class="librarian-dashboard-panel">
        <h3>Circulation snapshot</h3>
        <p>A quick view of how much of the physical book stock is currently issued.</p>
        <div class="librarian-circulation-meter" aria-label="Circulation percentage">
            <span style="width: <?php echo $circulation_percent; ?>%;"></span>
        </div>
        <div class="librarian-circulation-meta">
            <span><?php echo number_format($issued_copies); ?> issued</span>
            <span><?php echo $circulation_percent; ?>%</span>
            <span><?php echo number_format($available_copies); ?> available</span>
        </div>
    </div>
</div>