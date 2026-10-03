<!doctype html>
<html>
    <head>

        <style type="text/css">
            #loader {
                position: absolute;
                height: 100vh;
                width: 100vw;
                z-index: 1;
                background-color: rgba(0, 0, 0, 0.6);

            }
            #loader_text {
                margin-top: 50vh;
                z-index: 999;
                color: #fff;
                background-color: rgba(0,0,0,0.6);
                width: 400px;
                padding: 5px;
            }

         
        </style>
        <script type="text/javascript">

            /*document.onreadystatechange = function(e) {
                if(document.readyState !== 'complete') {
                    document.querySelector('body').style.visibility = 'hidden';
                    document.querySelector('#loader').style.visibility = 'visible';
                } else {
                    document.querySelector('#loader').style.display = 'none';
                    document.querySelector('body').style.visibility = 'visible';
                    $('.container').css('display', 'block');
                }
            }*/
        </script>

        <link rel="stylesheet" href="<?php echo base_url('assets/js/jquery-ui/css/no-theme/jquery-ui-1.10.3.custom.min.css'); ?>"/>
        <link rel="stylesheet" href="<?php echo base_url('assets/css/font-icons/entypo/css/entypo.css.min.css'); ?>"/>
        <link rel="stylesheet" href="<?php echo base_url(); ?>assets/cdn/fonts/noto-sans.css"/>
        <link rel="stylesheet" href="<?php echo base_url('assets/css/bootstrap.min.css'); ?>"/>
        <link rel="stylesheet" href="<?php echo base_url('assets/css/neon-core.css'); ?>"/>
        <link rel="stylesheet" href="<?php echo base_url('assets/css/neon-theme.css'); ?>"/>
        <link rel="stylesheet" href="<?php echo base_url('assets/css/neon-forms.css'); ?>"/>
        <link rel="stylesheet" href="<?php echo base_url('assets/css/custom.css'); ?>"/>

        <link rel="stylesheet" type="text/css" href="<?php echo base_url(); ?>assets/cdn/css/dataTables.dataTables.css"/>
        <link rel="stylesheet" type="text/css" href="<?php echo base_url(); ?>assets/cdn/css/buttons.dataTables.css"/>

        <script type="text/javascript" src="<?php echo base_url('assets/js/jquery-3.3.1.min.js'); ?>"></script>

         <script src="<?php echo base_url(); ?>assets/cdn/js/dataTables.js" crossorigin="anonymous"></script>
         <script src="<?php echo base_url(); ?>assets/cdn/js/dataTables.buttons-3.0.2.js" crossorigin="anonymous"></script>
         <script src="<?php echo base_url(); ?>assets/cdn/js/buttons.dataTables-3.2.4.js" crossorigin="anonymous"></script>
         <script src="<?php echo base_url(); ?>assets/cdn/js/jszip.min.js" crossorigin="anonymous"></script>
         <script src="<?php echo base_url(); ?>assets/cdn/js/pdfmake.min.js" crossorigin="anonymous"></script>
         <script src="<?php echo base_url(); ?>assets/cdn/js/vfs_fonts.js" crossorigin="anonymous"></script>
         <script src="<?php echo base_url(); ?>assets/cdn/js/buttons.html5.min.js" crossorigin="anonymous"></script>
         <script src="<?php echo base_url(); ?>assets/cdn/js/buttons.colVis.min.js" crossorigin="anonymous"></script>




    </head>
    <body>  
        <!--<div id="loader" >
            <div>
                <center>
                    <h1 id="loader_text">Loading please wait...</h1>
                </center>
            </div>
        </div>-->
<div class="container-fluid sm-students-page">
    <div class="students-page-head hidden-print">
        <div>
            <p class="students-eyebrow">Students</p>
            <h1 class="students-page-title"><?php echo get_phrase('all_active_students');?></h1>
            <p class="students-page-subtitle">Browse currently enrolled students, refine the list, and open supporting reports without leaving this workspace.</p>
        </div>
        <div class="students-page-actions">
            <a href="<?=base_url();?>admin/students_gender_report" target="_blank" class="btn btn-primary btn-icon icon-left hidden-print">
                <i class="glyphicon glyphicon-eye-open"></i>
                View Gender Report
            </a>
            <a onClick="PrintElem('#print')" class="btn btn-default btn-icon icon-left hidden-print">
                <i class="glyphicon glyphicon-print"></i>
                Print Students List
            </a>
        </div>
    </div>

    <div class="row">
        <div class="col-md-12">
            <div id="print">

                <style type="text/css">
                     #mark_print th, #grade_table th, #conducts th {
                        background-color: grey;
                        border: 2px solid #e2dddd;
                        padding: 5px;
                        color: white;
                        border-bottom: 2px solid red;
                     }

                    td {
                        padding: 5px;
                        text-align: center;
                    }

                    .al {
                        text-align: left !important;
                    }

                    /* Photo column toggle */
                    .photo-column-hidden {
                        display: none !important;
                    }

                    /* Prevent content breaking */
                    td {
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }

                    /* Allow wrapping only for name and address columns */
                    td.al {
                        white-space: normal;
                        word-wrap: break-word;
                    }

                    /* Print-specific styles */
                    @media print {
                        body {
                            font-size: 8px;
                        }
                        
                        table {
                            font-size: 7px;
                            width: 100%;
                            table-layout: fixed;
                        }
                        
                        th {
                            font-size: 8px;
                            padding: 2px !important;
                            white-space: nowrap;
                        }
                        
                        td {
                            font-size: 7px;
                            padding: 2px !important;
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;
                        }
                        
                        /* Specific column widths for print */
                        th:nth-child(1), td:nth-child(1) { width: 3%; } /* S/N */
                        th:nth-child(2), td:nth-child(2) { width: 8%; white-space: nowrap; } /* ID No */
                        th:nth-child(3), td:nth-child(3) { width: 5%; } /* Photo */
                        th:nth-child(4), td:nth-child(4) { width: 15%; white-space: normal; } /* Name */
                        th:nth-child(5), td:nth-child(5) { width: 6%; } /* Gender */
                        th:nth-child(6), td:nth-child(6) { width: 15%; white-space: normal; font-size: 6px; } /* Address */
                        th:nth-child(7), td:nth-child(7) { width: 8%; } /* Residence */
                        th:nth-child(8), td:nth-child(8) { width: 10%; } /* DOB */
                        th:nth-child(9), td:nth-child(9) { width: 15%; white-space: normal; } /* Parent */
                        th:nth-child(10), td:nth-child(10) { width: 10%; } /* Contact */
                        
                        h4 {
                            font-size: 10px;
                            margin: 3px 0;
                        }
                        
                        img {
                            max-width: 25px !important;
                            max-height: 25px !important;
                        }
                        
                        .hidden-print {
                            display: none !important;
                        }
                        
                        .photo-column-hidden {
                            display: none !important;
                        }

                        /* Adjust when photo column is hidden */
                        .photo-column-hidden ~ td:nth-child(4) { width: 18%; }
                        .photo-column-hidden ~ td:nth-child(6) { width: 18%; }
                    }

                </style>

            <div class="students-summary hidden-print">
                <div class="students-summary-title">
                    <span class="students-summary-icon"><i class="glyphicon glyphicon-users"></i></span>
                    <div>
                        <strong><?php echo get_phrase('all_active_students');?></strong>
                        <span>Current enrollment overview</span>
                    </div>
                </div>
                <div class="students-summary-stats">
                    <span class="students-stat-chip students-stat-male">Male <strong id="all_male"></strong></span>
                    <span class="students-stat-chip students-stat-female">Female <strong id="all_female"></strong></span>
                    <span class="students-stat-chip students-stat-unknown">Unknown <strong id="all_unknown"></strong></span>
                </div>
            </div>
                <div class="tab-content">
                <div class="tab-pane active" id="home">

                    <!-- Filter Section -->
                    <div class="panel panel-primary hidden-print" style="margin-top: 15px;">
                        <div class="panel-heading">
                            <h3 class="panel-title"><i class="glyphicon glyphicon-filter"></i> Filter Students</h3>
                        </div>
                        <div class="panel-body">
                            <div class="students-filter-grid">
                                <div class="students-filter-field">
                                    <label for="filter_residence">Residence Type</label>
                                    <select id="filter_residence" class="form-control">
                                        <option value="">All</option>
                                        <option value="Day">Day</option>
                                        <option value="Boarding">Boarding</option>
                                    </select>
                                </div>
                                <div class="students-filter-field">
                                    <label for="filter_class">Class</label>
                                    <select id="filter_class" class="form-control">
                                        <option value="">All Classes</option>
                                        <?php
                                        $allClassesIds = getAllClassList();
                                        foreach($allClassesIds as $class_id) {
                                            echo '<option value="'.getFullClassName($class_id).'">'.getFullClassName($class_id).'</option>';
                                        }
                                        ?>
                                    </select>
                                </div>
                                <div class="students-filter-field">
                                    <label for="filter_gender">Gender</label>
                                    <select id="filter_gender" class="form-control">
                                        <option value="">All</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>
                                <div class="students-filter-field">
                                    <label>Photo Column</label>
                                    <button id="toggle_photo" class="btn btn-info btn-block" onclick="togglePhotoColumn()">
                                        <i class="glyphicon glyphicon-picture"></i> Hide Photos
                                    </button>
                                </div>
                                <div class="students-filter-actions">
                                    <button class="btn btn-primary" onclick="applyFilters()">
                                        <i class="glyphicon glyphicon-filter"></i> Apply Filters
                                    </button>
                                    <button class="btn btn-default" onclick="resetFilters()">
                                        <i class="glyphicon glyphicon-refresh"></i> Reset
                                    </button>
                                    <span id="loading_indicator" style="display:none;">
                                        <i class="fa fa-spinner fa-spin"></i> Loading...
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="students-table-wrap">
                    <table class="table table-bordered table-striped table-hover table-active" style="width:100%; border-collapse:collapse;border: 1px solid #ccc;" border="1" id="students_print">
                        <thead>
                            <tr>
                                <th align="center" width="80"><div align="center">S/N</div></th>
                                <th align="center" width="80"><div align="center"><?php echo get_phrase('iD_no');?></div></th>
                                <th width="80" class="photo-column"><div align="center"><?php echo get_phrase('photo');?></div></th>
                                <th><div><?php echo get_phrase('name');?></div></th>
                                <th><div><?php echo get_phrase('gender');?></div></th>
                                <th class="span3"><div><?php echo get_phrase('address');?></div></th>
                                <th><div><?php echo get_phrase('residence_type');?></div></th>
                                <th><div align="center"><?php echo get_phrase('date_of_birth');?></div></th>
                                <th><div><?php echo get_phrase('parent_name');?></div></th>
                                <th><div><?php echo get_phrase('contact');?></div></th>
                            </tr>
                        </thead>
                        <tbody id="students_table_body">
            <?php
        $allClassesIds = getAllClassList();
            $grand_total = 0;

            $n_female = 0;
            $n_male = 0;
            $n_unknown = 0;

            for($i=0; $i < sizeof($allClassesIds); $i++):

                $class_total = 0;
                $class_female = 0;
                $class_male = 0;
                $class_unknown = 0;

                $this->db->select('enroll.student_id, name');
                $this->db->distinct();
                $this->db->from('enroll');
                $this->db->where('class_id', $allClassesIds[$i]);
                $this->db->where('year', $running_year);
                $this->db->where('term', $running_term);
                $this->db->where('enroll.mute', '0');  
                $this->db->order_by('sex', 'desc');  
                $this->db->order_by('name', 'asc');   
                                 
                $this->db->join('student', 'student.student_id = enroll.student_id');
                $students_ids = $this->db->get()->result_array(); 

                if(count($students_ids) > 0):
                    ?>
                    <tr>
                        <td colspan="10">
                            <h4 style="color: #000"><?=getFullClassName($allClassesIds[$i]); ?></h4>

                            <span class="text-muted">Male:</span> <span class="ml-5 text-muted" id="class_male_<?=$allClassesIds[$i]; ?>"></span> | 
                            <span class="text-muted">Female:</span> <span class="ml-5 text-muted" id="class_female_<?=$allClassesIds[$i]; ?>"></span> |
                            <span class="text-muted">Unknown:</span> <span class="ml-5 text-muted" id="class_unknown_<?=$allClassesIds[$i]; ?>"></span>

                        </td>
                    </tr>
                <?php
                endif;
                    $sn = 1;
                    foreach ($students_ids as $row):?>

                        <?php

                            $section_id = $this->db->get_where('enroll' , array('student_id'=>$row['student_id'], 'class_id' => $allClassesIds[$i]))->row()->section_id;

                            $student_info = $this->db->get_where('student', array('student_id' => $row['student_id']))->row();

                            $gender = $student_info->sex;

                            $sGender = strtolower($gender);

                            if($sGender == 'female') {
                                $n_female++;
                                $class_female++;

                            } else if($sGender == 'male') {
                                $n_male++;
                                $class_male++;

                            } else {
                                
                                $n_unknown++;
                                $class_unknown++;
                            }

                        ?>
                            
                            <tr class="student-row">
                            <td><?php echo $sn;?></td>
                            <td><?php echo $student_info->student_code;?></td>
                            <td class="photo-column"><img src="<?php echo $this->crud_model->get_image_url('student',$row['student_id'], $gender);?>" class="img-circle" width="40" height="40" /></td>
                            <td class="al">
                                <?php
                                    echo $row['name'];//. ' (<mark>'.$row['student_id'].'</mark>)';
                                ?>
                            </td>
                            <td class="al">
                                <?php
                                    echo $gender;
                                ?>
                            </td>
                            <td class="al" width="110">
                                <?php
                                    echo $student_info->address;
                                ?>
                            </td>
                            <td class="al">
                                <?php
                                    echo $this->crud_model->getStudentCurrentEnrollmentStatusRow($row['student_id'])->residence_type;
                                ?>
                            </td>

                            <!--
                            <td class="al">
                                <?php
                                    //echo getFullClassName($allClassesIds[$i], $section_id);
                                ?>
                            </td> --> 
                            <td>
                                <?php
                                    $bdate =  $student_info->birthday;

                                    if(!empty($bdate) && $bdate != '0000-00-00') {
                                        $bdate_create = date_create($bdate);
                                        if($bdate_create !== false) {
                                            echo date_format($bdate_create, 'M d, Y');
                                        }
                                    }
                                ?>
                            </td>   
                            <td class="al">
                                <?php
                                $parent_id = $student_info->parent_id;

                                    echo $this->db->get_where('parent' , array(
                                        'parent_id' => $parent_id
                                    ))->row()->name;
                                ?>
                            </td> 
                            <td class="al" width="50">
                                <?php
                                    echo $this->db->get_where('parent' , array(
                                        'parent_id' => $parent_id
                                    ))->row()->phone;
                                ?>
                            </td> 
                            
                            </tr>

                        <?php 

                        $sn++;
                        $grand_total++;

                    endforeach;
                     ?>

                    <script type="text/javascript">

                        $(function(ev) {


                            $('#class_male_<?=$allClassesIds[$i]; ?>').text('<?= number_format($class_male, 0, '.', ',') ?>');
                            $('#class_female_<?=$allClassesIds[$i]; ?>').text('<?= number_format($class_female, 0, '.', ',') ?>');
                            $('#class_unknown_<?=$allClassesIds[$i]; ?>').text('<?= number_format($class_unknown, 0, '.', ',') ?>');
                        })

                    </script>

                   
                    <!--<tr>
                        <td><strong>Class Total: <?=$class_total; ?></strong></td>
                        <td colspan="8"></td>
                    </tr>-->
                        <?php 

                        //$grand_total += $class_total;
            endfor;?>

                    <tr>
                        <td><strong>Total:</strong></td>
                        <td colspan="8" style="text-align: left"><strong><?=$grand_total; ?> Students currently enrolled.</strong></td>
                    </tr>
                    
                        </tbody>
                    </table>
                    </div>
                </div>   
            </div>
            </ul>
            </div>
        </div>
    </div>
</div>



<script type="text/javascript" src="<?php echo base_url('assets/js/bootstrap.js'); ?>"></script>
<script src="<?php echo base_url('assets/datatables/datatables.min.js');?>" type="text/javascript"></script>

<style type="text/css">
/* ---- Students workspace — modern enterprise presentation layer (screen only) ---- */
@media screen {
    body { background: #f8fafc; }
    .sm-students-page { width: 100%; max-width: 100%; padding: 24px 28px 40px; }

    .students-page-head {
        display: flex; align-items: flex-end; justify-content: space-between; gap: 20px;
        margin: 0 0 22px; padding: 0 0 18px; border-bottom: 1px solid #e2e8f0;
    }
    .students-eyebrow {
        margin: 0 0 4px; color: #2563eb; font-size: 13px; font-weight: 800;
        letter-spacing: .08em; text-transform: uppercase;
    }
    .students-page-title {
        margin: 0; color: #0f172a; font-size: 30px; line-height: 1.2; font-weight: 800;
        letter-spacing: -.02em;
    }
    .students-page-subtitle {
        margin: 7px 0 0; max-width: 760px; color: #64748b; font-size: 15px; line-height: 1.55;
    }
    .students-page-actions { display: flex; flex-wrap: wrap; gap: 10px; justify-content: flex-end; }
    .students-page-actions .btn {
        display: inline-flex; align-items: center; justify-content: center; gap: 8px;
        min-height: 42px; padding: 9px 16px;
    }

    .students-summary {
        display: flex; align-items: center; justify-content: space-between; gap: 18px;
        padding: 16px 18px; margin: 0 0 16px; background: #fff;
        border: 1px solid #e2e8f0; border-radius: 14px; box-shadow: 0 1px 2px rgba(15,23,42,.04);
    }
    .students-summary-title { display: flex; align-items: center; gap: 12px; min-width: 0; }
    .students-summary-title strong { display: block; color: #0f172a; font-size: 17px; line-height: 1.3; }
    .students-summary-title span:not(.students-summary-icon) {
        display: block; margin-top: 2px; color: #64748b; font-size: 13px;
    }
    .students-summary-icon {
        width: 42px; height: 42px; border-radius: 12px; background: #eff6ff; color: #2563eb;
        display: inline-flex; align-items: center; justify-content: center; font-size: 18px; flex: 0 0 auto;
    }
    .students-summary-stats { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
    .students-stat-chip {
        display: inline-flex; align-items: center; gap: 6px; min-height: 34px; padding: 6px 11px;
        border-radius: 999px; font-size: 13px; font-weight: 700; border: 1px solid transparent;
    }
    .students-stat-chip strong { font-size: 14px; color: inherit; }
    .students-stat-male { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
    .students-stat-female { background: #fdf2f8; color: #be185d; border-color: #fbcfe8; }
    .students-stat-unknown { background: #f8fafc; color: #475569; border-color: #e2e8f0; }

    .panel {
        background: #fff; border: 1px solid #e2e8f0; border-radius: 14px;
        box-shadow: 0 1px 2px rgba(15,23,42,.04); overflow: hidden;
    }
    .panel > .panel-heading {
        background: #fff; border-bottom: 1px solid #eef2f7; color: #0f172a; padding: 14px 18px;
    }
    .panel > .panel-heading .panel-title {
        display: flex; align-items: center; gap: 8px; margin: 0;
        font-size: 16px; font-weight: 800; color: #0f172a;
    }
    .panel > .panel-body { padding: 16px 18px; }

    .students-filter-grid {
        display: grid; grid-template-columns: minmax(150px,.9fr) minmax(190px,1.2fr) minmax(140px,.8fr) minmax(150px,.9fr) auto;
        gap: 12px; align-items: end;
    }
    .students-filter-field label {
        display: block; margin: 0 0 6px; color: #334155; font-size: 14px; font-weight: 700;
    }
    .students-filter-actions {
        display: flex; align-items: center; gap: 8px; min-height: 44px; white-space: nowrap;
    }
    .students-filter-actions .btn { min-height: 44px; }
    #loading_indicator { color: #475569; font-size: 14px; font-weight: 600; }

    .btn {
        min-height: 42px; border-radius: 9px; font-size: 14px; font-weight: 700;
        transition: background-color .15s ease, border-color .15s ease, box-shadow .15s ease, transform .15s ease;
    }
    .btn:hover { transform: translateY(-1px); }
    .btn:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(37,99,235,.25); }
    .btn-primary { background: #2563eb; border-color: #2563eb; }
    .btn-primary:hover { background: #1d4ed8; border-color: #1d4ed8; }
    .btn-info { background: #0284c7; border-color: #0284c7; }

    .form-control {
        height: 44px; padding: 9px 12px; border: 1px solid #cbd5e1; border-radius: 9px;
        font-size: 15px; color: #0f172a; background: #fff;
        transition: border-color .15s ease, box-shadow .15s ease;
    }
    .form-control:focus {
        border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.14); outline: none;
    }

    .students-table-wrap {
        width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; margin-top: 14px;
        border: 1px solid #e2e8f0; border-radius: 14px; background: #fff;
    }
    #students_print {
        width: 100% !important; min-width: 1080px; margin: 0 !important; border: 0 !important;
        border-radius: 0; border-collapse: separate !important; border-spacing: 0;
    }
    #students_print th {
        background: #f8fafc; color: #475569; font-size: 13px; font-weight: 800;
        text-transform: uppercase; letter-spacing: .035em; border-bottom: 1px solid #e2e8f0 !important;
        padding: 13px 12px; white-space: nowrap; vertical-align: middle;
    }
    #students_print td {
        padding: 12px; border-bottom: 1px solid #eef2f7; color: #334155;
        font-size: 14px; line-height: 1.45; vertical-align: middle;
    }
    #students_print tr.student-row:hover td { background: #f8fbff; }
    #students_print img.img-circle {
        width: 42px; height: 42px; object-fit: cover; border: 2px solid #e2e8f0;
        border-radius: 50%; box-shadow: 0 1px 2px rgba(15,23,42,.08);
    }
    #students_print tbody > tr > td[colspan="10"] {
        background: #f8fafc; padding: 12px 14px; color: #0f172a;
    }
    #students_print tbody > tr > td[colspan="10"] h4 {
        margin: 0 0 5px; font-size: 15px; font-weight: 800;
    }
    #students_print .text-muted { color: #64748b; font-size: 13px; }

    .tab-content { padding: 0; }
    hr { border-color: #e2e8f0; }

    @media (max-width: 1199px) {
        .students-filter-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
        .students-filter-actions { grid-column: 1 / -1; }
    }
    @media (max-width: 767px) {
        .sm-students-page { padding: 18px 14px 32px; }
        .students-page-head { align-items: flex-start; flex-direction: column; }
        .students-page-actions { width: 100%; justify-content: flex-start; }
        .students-page-title { font-size: 26px; }
        .students-summary { align-items: flex-start; flex-direction: column; }
        .students-summary-stats { justify-content: flex-start; }
        .students-filter-grid { grid-template-columns: 1fr; }
        .students-filter-actions { grid-column: auto; flex-wrap: wrap; }
        .panel > .panel-body { padding: 14px; }
    }
    @media (max-width: 400px) {
        .students-page-actions .btn { width: 100%; }
        .students-summary-stats { width: 100%; }
        .students-stat-chip { flex: 1 1 auto; justify-content: center; }
        .students-filter-actions .btn { flex: 1 1 auto; }
    }
}</style>
</body>
</html>    
    
<script type="text/javascript">

    var running_year = '<?php echo $running_year; ?>';
    var running_term = '<?php echo $running_term; ?>';

    $(function($) {
        $('#all_male').text('<?= number_format($n_male, 0, '.', ',') ?>');
        $('#all_female').text('<?= number_format($n_female, 0, '.', ',') ?>');
        $('#all_unknown').text('<?= number_format($n_unknown, 0, '.', ',') ?>');
    });

    // Apply filters via AJAX
    function applyFilters() {
        var residenceFilter = $('#filter_residence').val();
        var classFilter = $('#filter_class').val();
        var genderFilter = $('#filter_gender').val();

        $('#loading_indicator').show();
        
        // Clear existing table body first
        $('#students_table_body').html('<tr><td colspan="10" style="text-align:center;">Loading...</td></tr>');

        $.ajax({
            url: '<?php echo site_url('admin/get_filtered_students'); ?>',
            type: 'POST',
            data: {
                year: running_year,
                term: running_term,
                residence: residenceFilter,
                class: classFilter,
                gender: genderFilter,
                '<?php echo $this->security->get_csrf_token_name(); ?>': '<?php echo $this->security->get_csrf_hash(); ?>'
            },
            dataType: 'json',
            success: function(response) {
                $('#loading_indicator').hide();
                
                console.log('Response received:', response);
                
                if (response.status === 'success') {
                    // Replace table body content
                    $('#students_table_body').empty().html(response.html);
                    
                    // Update header counts
                    $('#all_male').text(response.male.toLocaleString());
                    $('#all_female').text(response.female.toLocaleString());
                    $('#all_unknown').text(response.unknown.toLocaleString());
                } else {
                    showAjaxModal_alert('Error loading filtered data');
                    $('#students_table_body').html('<tr><td colspan="10" style="text-align:center; color:red;">Error loading data</td></tr>');
                }
            },
            error: function(xhr, status, error) {
                $('#loading_indicator').hide();
                console.log('Error details:', xhr.responseText);
                showAjaxModal_alert('Error connecting to server: ' + error);
                $('#students_table_body').html('<tr><td colspan="10" style="text-align:center; color:red;">Error: ' + error + '</td></tr>');
            }
        });
    }

    function resetFilters() {
        $('#filter_residence').val('');
        $('#filter_class').val('');
        $('#filter_gender').val('');
        
        // Reload page to show all students
        location.reload();
    }

    // Toggle photo column visibility
    var photoColumnVisible = true;
    function togglePhotoColumn() {
        photoColumnVisible = !photoColumnVisible;
        
        if (photoColumnVisible) {
            $('.photo-column').removeClass('photo-column-hidden');
            $('#toggle_photo').html('<i class="glyphicon glyphicon-picture"></i> Hide Photos');
        } else {
            $('.photo-column').addClass('photo-column-hidden');
            $('#toggle_photo').html('<i class="glyphicon glyphicon-picture"></i> Show Photos');
        }
    }
   
 function PrintElem(elem)
    {
        var printWindow = window.open('', 'Print Students List', 'height=800,width=1200');
        printWindow.document.write('<!DOCTYPE html>');
        printWindow.document.write('<html><head><title>All Active Students</title>');
        printWindow.document.write('<style>');
        printWindow.document.write('body { font-family: Arial, sans-serif; margin: 10px; font-size: 8px; }');
        printWindow.document.write('table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 7px; table-layout: fixed; }');
        printWindow.document.write('th, td { border: 1px solid #ccc; padding: 2px; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }');
        printWindow.document.write('th { background-color: #666; color: white; font-weight: bold; font-size: 8px; }');
        printWindow.document.write('td { font-size: 7px; }');
        
        // Column widths
        printWindow.document.write('th:nth-child(1), td:nth-child(1) { width: 3%; }'); // S/N
        printWindow.document.write('th:nth-child(2), td:nth-child(2) { width: 8%; white-space: nowrap; }'); // ID No
        printWindow.document.write('th:nth-child(3), td:nth-child(3) { width: 5%; }'); // Photo
        printWindow.document.write('th:nth-child(4), td:nth-child(4) { width: 15%; white-space: normal; word-wrap: break-word; }'); // Name
        printWindow.document.write('th:nth-child(5), td:nth-child(5) { width: 6%; }'); // Gender
        printWindow.document.write('th:nth-child(6), td:nth-child(6) { width: 15%; white-space: normal; word-wrap: break-word; font-size: 6px; }'); // Address
        printWindow.document.write('th:nth-child(7), td:nth-child(7) { width: 8%; }'); // Residence
        printWindow.document.write('th:nth-child(8), td:nth-child(8) { width: 10%; }'); // DOB
        printWindow.document.write('th:nth-child(9), td:nth-child(9) { width: 15%; white-space: normal; word-wrap: break-word; }'); // Parent
        printWindow.document.write('th:nth-child(10), td:nth-child(10) { width: 10%; }'); // Contact
        
        printWindow.document.write('img { max-width: 25px; max-height: 25px; }');
        printWindow.document.write('.al { text-align: left !important; }');
        printWindow.document.write('h4 { margin: 3px 0; color: #000; font-size: 10px; }');
        printWindow.document.write('.text-muted { color: #666; font-size: 8px; }');
        printWindow.document.write('.ml-5 { margin-left: 5px; }');
        printWindow.document.write('.photo-column-hidden { display: none !important; }');
        printWindow.document.write('@media print { body { margin: 5px; } @page { size: landscape; margin: 10mm; } }');
        printWindow.document.write('</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write('<h2 style="text-align: center; margin-bottom: 15px; font-size: 12px;">All Active Students</h2>');
        printWindow.document.write($(elem).html());
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        
        // Wait for content to load before printing
        setTimeout(function() {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }, 500);
    }
</script>

