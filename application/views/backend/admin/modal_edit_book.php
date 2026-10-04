<?php 
$edit_data		=	$this->db->get_where('book' , array('book_id' => $param2) )->result_array();

?>
<style>
/* Direct UI/UX rebuild — Edit Book modal */
.library-book-edit-modal {
    padding: 0 !important;
    background: #fff;
}
.library-book-edit-modal .box-content {
    padding: 18px !important;
}
.library-book-edit-modal .form-group {
    margin: 0 0 15px !important;
}
.library-book-edit-modal .control-label {
    padding-top: 10px;
    color: #334155;
    font-size: 14px;
    line-height: 1.4;
    font-weight: 700;
    text-align: left;
}
.library-book-edit-modal .form-control,
.library-book-edit-modal .selectboxit-container .selectboxit {
    min-height: 46px !important;
    height: 46px !important;
    padding: 9px 11px !important;
    border: 1px solid #cbd5e1 !important;
    border-radius: 9px !important;
    background: #fff !important;
    color: #0f172a !important;
    font-size: 15px !important;
}
.library-book-edit-modal input[type="file"].form-control {
    height: auto !important;
}
.library-book-edit-modal .form-control:focus {
    border-color: #2563eb !important;
    box-shadow: 0 0 0 3px rgba(37,99,235,.12) !important;
    outline: none;
}
.library-book-edit-modal h4[style*="background-color"] {
    display: inline-flex;
    align-items: center;
    min-height: 34px;
    margin: 0;
    padding: 6px 10px !important;
    border-radius: 999px;
    font-size: 13px;
    line-height: 1.3;
    font-weight: 800;
}
.library-book-edit-modal button[type="submit"] {
    min-height: 44px;
    padding: 9px 16px !important;
    border-radius: 9px !important;
    background: #059669 !important;
    border-color: #059669 !important;
    color: #fff !important;
    font-size: 14px !important;
    font-weight: 800 !important;
}
.library-book-edit-modal button[type="submit"]:hover {
    background: #047857 !important;
    border-color: #047857 !important;
}
@media (max-width: 767px) {
    .library-book-edit-modal .box-content { padding: 15px !important; }
    .library-book-edit-modal .control-label {
        padding-top: 0;
        margin-bottom: 7px;
    }
    .library-book-edit-modal .form-group > [class*="col-"] {
        width: 100% !important;
        float: none !important;
        padding-left: 0;
        padding-right: 0;
    }
    .library-book-edit-modal .form-control { font-size: 16px !important; }
    .library-book-edit-modal button[type="submit"] { width: 100%; }
}
</style>

<div class="tab-pane box active library-book-edit-modal" id="edit" style="padding: 5px">
    <div class="box-content">
        <?php foreach($edit_data as $row):
            if($row['status'] == 'Available') {
            $bcolor = 'green';
            $color = 'white';
        }else{
            $bcolor = 'red';
            $color = 'yellow';
        }

        ?>
        <?php echo form_open(site_url('admin/book/do_update/'.$row['book_id']) , array('class' => 'form-horizontal form-groups-bordered validate','target'=>'_top','enctype'=>'multipart/form-data'));?>
                <div class="form-group">
                    <label class="col-sm-3 control-label"><?php echo get_phrase('book_status');?></label>
                    <div class="col-sm-5">
                        <h4 style="background-color: <?php echo $bcolor;?>; color: <?php echo $color;?>; padding: 3px; text-align: center;"><?php echo $row['status']; ?></h4>
                    </div>
                </div>
                <div class="form-group">
                    <label class="col-sm-3 control-label"><?php echo get_phrase('name');?></label>
                    <div class="col-sm-5">
                        <input type="text" class="form-control" name="name" value="<?php echo $row['name'];?>"
                            data-validate="required" data-message-required="<?php echo get_phrase('value_required');?>"/>
                    </div>
                </div>
                <div class="form-group">
                    <label class="col-sm-3 control-label"><?php echo get_phrase('author');?></label>
                    <div class="col-sm-5">
                        <input type="text" class="form-control" name="author" value="<?php echo $row['author'];?>"/>
                    </div>
                </div>
                <div class="form-group">
                    <label class="col-sm-3 control-label"><?php echo get_phrase('description');?></label>
                    <div class="col-sm-5">
                        <input type="text" class="form-control" name="description" value="<?php echo $row['description'];?>"/>
                    </div>
                </div>
                <div class="form-group">
                    <label class="col-sm-3 control-label"><?php echo get_phrase('price');?></label>
                    <div class="col-sm-5">
                        <input type="text" class="form-control" name="price" value="<?php echo $row['price'];?>"/>
                    </div>
                </div>
                <div class="form-group">
                    <label class="col-sm-3 control-label"><?php echo get_phrase('total_copies');?></label>
                    <div class="col-sm-5">
                        <input type="text" class="form-control" name="total_copies" value="<?php echo $row['total_copies'];?>"/>
                    </div>
                </div>
                <div class="form-group">
                    <label class="col-sm-3 control-label"><?php echo get_phrase('class');?></label>
                    <div class="col-sm-5">
                        <select name="class_id" class="form-control selectboxit">
                            <?php 
                            $classes = $this->db->get('class')->result_array();
                            foreach($classes as $row2):
                            ?>
                                <option value="<?php echo $row2['class_id'];?>"
                                    <?php if($row['class_id']==$row2['class_id'])echo 'selected';?>><?php echo $row2['name'].' '.$row2['name_numeric'];?></option>
                            <?php
                            endforeach;
                            ?>
                        </select>
                    </div>
                </div>
            <div class="form-group">
                <label class="col-sm-3 control-label"><?php echo get_phrase('file'); ?></label>

                <div class="col-sm-5">

                    <input type="file" name="file_name" class="form-control file2 inline btn btn-primary" data-label="<i class='glyphicon glyphicon-file'></i> Browse" />

                </div>
            </div>

                <!--<div class="form-group">
                    <label class="col-sm-3 control-label"><?php echo get_phrase('status');?></label>
                    <div class="col-sm-5">
                        <select name="status" class="form-control selectboxit">
                            <option value="available" <?php if($row['status']=='available')echo 'selected';?>><?php echo get_phrase('available');?></option>
                            <option value="unavailable" <?php if($row['status']=='unavailable')echo 'selected';?>><?php echo get_phrase('unavailable');?></option>
                        </select>
                    </div>
                </div>-->
                <div class="form-group">
                  <div class="col-sm-offset-3 col-sm-5">
                      <button type="submit" class="btn btn-success"><?php echo get_phrase('edit_book');?></button>
                  </div>
                </div>
        </form>
        <?php endforeach;?>
    </div>
</div>