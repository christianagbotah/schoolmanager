<div class="noticeboard-table-shell">
<table class="table datatable noticeboard-table" id="running_notice_table">
<thead><tr><th style="width:60px">#</th><th><?php echo get_phrase('title'); ?></th><th style="width:150px"><?php echo get_phrase('date'); ?></th><th style="width:190px;text-align:right"><?php echo get_phrase('options'); ?></th></tr></thead>
<tbody>
<?php $count=1; $notices=$this->db->order_by('create_timestamp','DESC')->get_where('noticeboard',['status'=>1])->result_array(); foreach($notices as $row): ?>
<tr>
<td><?php echo $count++; ?></td>
<td class="noticeboard-title-cell"><?php echo html_escape($row['notice_title']); ?></td>
<td><?php echo date('d M Y',(int)$row['create_timestamp']); ?></td>
<td><div class="noticeboard-row-actions">
<button type="button" class="btn btn-default" title="View / Print" onclick="showAjaxModal('<?php echo site_url('modal/popup/modal_view_notice/'.$row['notice_id']); ?>')"><i class="fa fa-eye"></i></button>
<a class="btn btn-default" title="Archive" href="<?php echo site_url('admin/noticeboard/mark_as_archive/'.$row['notice_id']); ?>"><i class="fa fa-archive"></i></a>
<a class="btn btn-default" title="Edit" href="<?php echo site_url('admin/noticeboard_edit/'.$row['notice_id']); ?>"><i class="fa fa-edit"></i></a>
<button type="button" class="btn btn-danger" title="Delete" onclick="confirm_modal('<?php echo site_url('admin/noticeboard/delete/'.$row['notice_id']); ?>')"><i class="fa fa-trash"></i></button>
</div></td>
</tr>
<?php endforeach; ?>
</tbody>
</table>
</div>
